const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const Item = require("../models/Item");

const router = express.Router();

// Python config
const localVenvPython = path.join(__dirname, "../../.venv/bin/python");

const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (fs.existsSync(localVenvPython) ? localVenvPython : "python3");

const ML_SCRIPT = path.join(__dirname, "../../scrach Detection/recommender.py");

router.get("/:itemId", async (req, res) => {
  try {
    const targetId = req.params.itemId;

    // Get all products
    const allItems = await Item.find({}).lean();

    if (!allItems || allItems.length === 0) {
      return res.status(404).json({
        error: "No items found in database.",
      });
    }

    // Send data to Python
    const payload = JSON.stringify({
      target_id: targetId,
      items: allItems,
    });

    const child = spawn(PYTHON_BIN, [ML_SCRIPT]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    // Pipe JSON into stdin
    child.stdin.write(payload);
    child.stdin.end();

    child.on("close", async (code) => {
      if (code !== 0) {
        console.error("ML Error:", stderr);

        return res.status(500).json({
          error: "Recommendation Engine failed.",
        });
      }

      try {
        const aiResult = JSON.parse(stdout);

        if (!aiResult.success) {
          return res.status(400).json({
            error: aiResult.error,
          });
        }

        // Fetch recommended products
        const recommendedItems = await Item.find({
          _id: { $in: aiResult.recommendations },
        });

        return res.json({
          success: true,
          targetItem: targetId,
          recommendations: recommendedItems,
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
});

module.exports = router;
