const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

const localVenvPython = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (fs.existsSync(localVenvPython) ? localVenvPython : "python3");
const CV_SCRIPT = path.join(
  __dirname,
  "../../scrach Detection/damage_detector.py",
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/returns");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const upload = multer({ storage }).fields([
  { name: "before_front", maxCount: 1 },
  { name: "before_back", maxCount: 1 },
  { name: "before_left", maxCount: 1 },
  { name: "before_right", maxCount: 1 },
  { name: "after_front", maxCount: 1 },
  { name: "after_back", maxCount: 1 },
  { name: "after_left", maxCount: 1 },
  { name: "after_right", maxCount: 1 },
]);

router.post(
  "/verify-360",
  authenticate,
  authorizeRole("admin"),
  upload,
  async (req, res) => {
    try {
      const requiredFields = [
        "before_front",
        "before_back",
        "before_left",
        "before_right",
        "after_front",
        "after_back",
        "after_left",
        "after_right",
      ];
      const missing = requiredFields.filter(
        (field) => !req.files?.[field]?.length,
      );

      if (missing.length > 0) {
        return res.status(400).json({
          error:
            "Missing images. 8 files required: before_* and after_* for front, back, left, right.",
          missing,
        });
      }

      const b_front = req.files["before_front"][0].path;
      const b_back = req.files["before_back"][0].path;
      const b_left = req.files["before_left"][0].path;
      const b_right = req.files["before_right"][0].path;

      const a_front = req.files["after_front"][0].path;
      const a_back = req.files["after_back"][0].path;
      const a_left = req.files["after_left"][0].path;
      const a_right = req.files["after_right"][0].path;

      const child = spawn(PYTHON_BIN, [
        CV_SCRIPT,
        b_front,
        a_front,
        b_back,
        a_back,
        b_left,
        a_left,
        b_right,
        a_right,
      ]);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("close", (code) => {
        if (code !== 0) {
          console.error("OpenCV Error:", stderr);

          return res.status(500).json({
            error: "AI 360 Vision analysis failed.",
          });
        }

        try {
          const aiResult = JSON.parse(stdout);

          return res.json({
            ok: true,
            message: aiResult.damage_detected
              ? `Damage detected on: ${aiResult.damaged_sides.join(", ")}`
              : "All 4 sides verified clean.",
            metrics: aiResult,
          });
        } catch (err) {
          return res.status(500).json({
            error: "Invalid Python output formatting.",
          });
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  },
);

module.exports = router;
