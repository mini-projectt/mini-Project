const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const chatbotRoute = require("./routes/chatbot.route");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve images from frontend public folder
app.use(
  "/images",
  express.static(path.join(__dirname, "../frontend/public/images")),
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/chatbot", require("./routes/chatbot"));
app.use("/api/chatbot", chatbotRoute);
app.use("/api/scanner", require("./routes/scanner.route"));
app.use("/api/recommendations", require("./routes/recommendation.route"));

// Health check
app.get("/", (req, res) => res.json({ message: "Rental App API Running" }));

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/rentalapp";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
