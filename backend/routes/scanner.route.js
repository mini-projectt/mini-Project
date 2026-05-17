const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const Order = require("../models/Order");

const router = express.Router();

// Python Setup
const localVenvPython = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN = process.env.PYTHON_BIN || (fs.existsSync(localVenvPython) ? localVenvPython : "python3");
const CV_SCRIPT = path.join(__dirname, "../../scrach Detection/damage_detector.py"); // Using Harii's folder name

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/returns");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `after_${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

// UPGRADE: Accept 4 distinct named files instead of just 1
const upload = multer({ storage }).fields([
    { name: 'after_front', maxCount: 1 },
    { name: 'after_back', maxCount: 1 },
    { name: 'after_left', maxCount: 1 },
    { name: 'after_right', maxCount: 1 }
]);

router.post("/verify-360", upload, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Ensure all 4 images were uploaded
    if (!req.files || Object.keys(req.files).length !== 4) {
      return res.status(400).json({ error: "Missing images. 4 sides (front, back, left, right) are required." });
    }

    // A. Fetch the original 4 'Before' images from MongoDB
    // Note: You must ensure your Order/Item model is updated to store 4 image paths instead of 1!
    const order = await Order.findById(orderId).populate("item");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Assuming the DB stores paths like: item.images.front, item.images.back, etc.
    const b_front = path.join(__dirname, "..", order.item.images.front);
    const b_back  = path.join(__dirname, "..", order.item.images.back);
    const b_left  = path.join(__dirname, "..", order.item.images.left);
    const b_right = path.join(__dirname, "..", order.item.images.right);

    // B. Get the new 'After' image paths from Multer
    const a_front = req.files['after_front'][0].path;
    const a_back  = req.files['after_back'][0].path;
    const a_left  = req.files['after_left'][0].path;
    const a_right = req.files['after_right'][0].path;

    // C. Spawn the Python process with all 8 arguments in pairs
    const child = spawn(PYTHON_BIN, [
        CV_SCRIPT, 
        b_front, a_front, 
        b_back, a_back, 
        b_left, a_left, 
        b_right, a_right
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

    child.on("close", (code) => {
      if (code !== 0) {
        console.error("OpenCV Error:", stderr);
        return res.status(500).json({ error: "AI 360 Vision analysis failed." });
      }

      try {
        const aiResult = JSON.parse(stdout);
        
        return res.json({
          ok: true,
          message: aiResult.damage_detected ? `Damage detected on: ${aiResult.damaged_sides.join(', ')}` : "All 4 sides verified clean.",
          metrics: aiResult
        });
      } catch (err) {
        return res.status(500).json({ error: "Invalid Python output formatting." });
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;