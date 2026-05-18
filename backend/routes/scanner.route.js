const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const { authenticate, authorizeRole } = require("../middleware/auth");
const Order = require("../models/Order");

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

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `after_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
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

const cleanupFiles = (files) => {
  if (!files) return;

  Object.values(files).forEach((fileArray) => {
    fileArray.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  });
};

router.post(
  "/verify-360",
  authenticate,
  authorizeRole("admin"),
  upload,
  async (req, res) => {
    try {
      const { orderId } = req.body;

      if (
        !req.files ||
        !req.files.before_front ||
        !req.files.before_back ||
        !req.files.before_left ||
        !req.files.before_right ||
        !req.files.after_front ||
        !req.files.after_back ||
        !req.files.after_left ||
        !req.files.after_right
      ) {
        cleanupFiles(req.files);

        return res.status(400).json({
          error:
            "Missing images. All 4 sides (front, back, left, right) are required for before and after.",
        });
      }

      if (!orderId) {
        cleanupFiles(req.files);

        return res.status(400).json({
          error: "Order ID is required.",
        });
      }

      const order = await Order.findById(orderId).populate("item");

      if (!order) {
        cleanupFiles(req.files);

        return res.status(404).json({
          error: "Order not found.",
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

      if (!fs.existsSync(CV_SCRIPT)) {
        cleanupFiles(req.files);
        return res.status(500).json({
          error: "Damage detector script not found.",
        });
      }

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

      child.on("error", (err) => {
        console.error("Python spawn error:", err);
        cleanupFiles(req.files);
        return res.status(500).json({
          error: "Failed to start python process.",
          details: err.message,
        });
      });

      child.on("close", (code) => {
        if (code !== 0) {
          console.error("OpenCV Error:", stderr);
          return res.status(500).json({
            error: "AI 360 Vision analysis failed.",
            details: stderr || "No stderr output.",
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
          console.error("Failed to parse Python output:", stdout);

          return res.status(500).json({
            error: "Invalid Python output formatting.",
          });
        }
      });
    } catch (error) {
      cleanupFiles(req.files);

      return res.status(500).json({
        error: error.message,
      });
    }
  },
);

module.exports = router;
