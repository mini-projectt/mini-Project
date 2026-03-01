const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Item = require("../models/Item");

// GET all reviews for an item
router.get("/:itemId", async (req, res) => {
  try {
    const reviews = await Review.find({ item: req.params.itemId }).sort({
      createdAt: -1,
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a review for an item
router.post("/:itemId", async (req, res) => {
  try {
    const { reviewerName, rating, comment } = req.body;

    if (!reviewerName || !rating) {
      return res.status(400).json({ error: "Name and rating are required." });
    }

    const review = new Review({
      item: req.params.itemId,
      reviewerName,
      rating: Number(rating),
      comment,
    });

    await review.save();

    // Recompute averageRating and reviewCount on the item
    const allReviews = await Review.find({ item: req.params.itemId });
    const reviewCount = allReviews.length;
    const averageRating =
      reviewCount > 0
        ? Math.round(
            (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) *
              10,
          ) / 10
        : 0;

    await Item.findByIdAndUpdate(req.params.itemId, {
      averageRating,
      reviewCount,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
