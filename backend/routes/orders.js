const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Item = require("../models/Item");

// GET all orders (admin)
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("item").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order (rent an item)
router.post("/", async (req, res) => {
  try {
    const {
      item: itemId,
      rentalDays,
      startDate,
      customerName,
      customerEmail,
      customerPhone,
    } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (!item.available || item.quantity < 1)
      return res.status(400).json({ error: "Item is not available for rent" });

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(rentalDays));

    const totalAmount = item.pricePerDay * rentalDays;

    const order = new Order({
      customerName,
      customerEmail,
      customerPhone,
      item: itemId,
      itemName: item.name,
      rentalDays,
      startDate: start,
      endDate: end,
      totalAmount,
      depositAmount: item.depositAmount,
    });

    // Decrease quantity
    item.quantity -= 1;
    if (item.quantity === 0) item.available = false;
    await item.save();

    const saved = await order.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update order status (admin)
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("item");
    if (!order) return res.status(404).json({ error: "Order not found" });

    // If returned, restore quantity
    if (req.body.status === "Returned") {
      await Item.findByIdAndUpdate(order.item._id, {
        $inc: { quantity: 1 },
        available: true,
      });
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
