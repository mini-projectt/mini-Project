const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { authenticate, authorizeRole } = require("../middleware/auth");

// GET all items
router.get("/", async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available !== undefined) filter.available = available === "true";

    const items = await Item.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single item
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create item (admin)
router.post("/", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const item = new Item(req.body);
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update item (admin)
router.put("/:id", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE item (admin)
router.delete(
  "/:id",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const item = await Item.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json({ message: "Item deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
