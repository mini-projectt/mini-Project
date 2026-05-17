const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// 1. Setup Python Environment exactly like his chatbot.js
const localVenvPython = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (fs.existsSync(localVenvPython) ? localVenvPython : "python3");
const CV_SCRIPT = path.join(
  __dirname,
  "..",
  "..",
  "scrach Detection",
  "damage_detector.py",
); // Path to your OpenCV script

// 2. Setup Multer to save the "Before" and "After" images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/returns");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const suffix = file.fieldname === "beforeImage" ? "before" : "after";
    cb(
      null,
      `${suffix}_return_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});
const upload = multer({ storage });

// 3. The AI Verification Endpoint
router.post(
  "/verify",
  authenticate,
  authorizeRole("admin"),
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const beforeFile = req.files?.beforeImage?.[0];
      const afterFile = req.files?.afterImage?.[0];

      if (!beforeFile || !afterFile) {
        return res
          .status(400)
          .json({ error: "Both 'before' and 'after' images are required." });
      }

      const beforeImagePath = beforeFile.path;
      const afterImagePath = afterFile.path;

      // C. Spawn your OpenCV Python Script
      const child = spawn(PYTHON_BIN, [
        CV_SCRIPT,
        beforeImagePath,
        afterImagePath,
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
          return res.status(500).json({ error: "AI Vision analysis failed." });
        }

        try {
          const aiResult = JSON.parse(stdout);

          // Return the clean result back to the frontend without modifying DB yet!
          return res.json({
            ok: true,
            message: aiResult.damage_detected
              ? "Damage Detected!"
              : "Item is clean.",
            metrics: aiResult,
          });
        } catch (err) {
          return res
            .status(500)
            .json({ error: "Invalid Python output formatting." });
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
