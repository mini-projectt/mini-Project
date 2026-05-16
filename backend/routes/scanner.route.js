const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const Order = require("../models/Order");
const Item = require("../models/Item");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// 1. Setup Python Environment exactly like his chatbot.js
const localVenvPython = path.join(__dirname, "../../.venv/bin/python");
const PYTHON_BIN = process.env.PYTHON_BIN || (fs.existsSync(localVenvPython) ? localVenvPython : "python3");
const CV_SCRIPT = path.join(__dirname, "../../rent_sphere_cv/damage_detector.py"); // Path to your OpenCV script

// 2. Setup Multer to save the "After" images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/returns");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `after_return_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// 3. The AI Verification Endpoint
router.post("/verify", authenticate, authorizeRole("admin"), upload.single("afterImage"), async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No 'after' image provided." });
    }

    // A. Fetch the Order and the linked Item to get the "Before" image
    const order = await Order.findById(orderId).populate("item");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // B. Get the paths
    const afterImagePath = req.file.path;
    // Assuming his item.imageUrl is a local file path like "uploads/items/camera.jpg"
    // If it's a full URL (like cloudinary), Python will need to download it first.
    const beforeImagePath = path.join(__dirname, "..", order.item.imageUrl); 

    if (!fs.existsSync(beforeImagePath)) {
        return res.status(404).json({ error: "Original 'Before' image not found on server to compare against." });
    }

    // C. Spawn your OpenCV Python Script
    const child = spawn(PYTHON_BIN, [CV_SCRIPT, beforeImagePath, afterImagePath]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

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
          message: aiResult.damage_detected ? "Damage Detected!" : "Item is clean.",
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