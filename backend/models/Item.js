const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    quantity: { type: Number, default: 1 },
    imageUrl: { type: String, default: "" },
    imagePosition: { type: String, default: "center" },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    condition: {
      type: String,
      enum: ["Excellent", "Good", "Fair"],
      default: "Good",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Item", itemSchema);
