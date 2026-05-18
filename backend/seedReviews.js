const mongoose = require("mongoose");
require("dotenv").config();
const Item = require("./models/Item");
const Review = require("./models/Review");
const User = require("./models/User");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/rentalapp";

const USER_COUNT = Number(process.env.SEED_USER_COUNT || 20);
const MIN_REVIEWS_PER_ITEM = Number(process.env.SEED_MIN_REVIEWS || 2);
const EXTRA_REVIEWS_MAX = Number(process.env.SEED_EXTRA_REVIEWS_MAX || 3);
const DEFAULT_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "password123";

const FIRST_NAMES = [
  "Aarav",
  "Aditi",
  "Akash",
  "Ananya",
  "Arjun",
  "Bhavya",
  "Diya",
  "Ishaan",
  "Kabir",
  "Kiran",
  "Meera",
  "Neha",
  "Nikhil",
  "Pooja",
  "Ravi",
  "Riya",
  "Rohan",
  "Sana",
  "Sneha",
  "Vikram",
];

const LAST_NAMES = [
  "Bose",
  "Chaudhary",
  "Gupta",
  "Iyer",
  "Jain",
  "Kapoor",
  "Khan",
  "Kumar",
  "Mehta",
  "Nair",
  "Patel",
  "Reddy",
  "Shah",
  "Sharma",
  "Singh",
  "Verma",
];

const COMMENTS = [
  "Great quality and easy to use.",
  "Worked perfectly for my event.",
  "Clean item and good condition.",
  "Would rent again.",
  "Value for money.",
  "Pickup and return were smooth.",
  "Helped me finish the job fast.",
  "No issues, everything worked well.",
  "Exactly as described.",
  "Nice and reliable item.",
];

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomRating() {
  return 3 + Math.floor(Math.random() * 3);
}

function randomInt(min, max) {
  const minValue = Math.ceil(min);
  const maxValue = Math.floor(max);
  return Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
}

async function createRandomUsers(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return [];
  }

  const createdUsers = [];
  const timestamp = Date.now();

  for (let i = 0; i < count; i += 1) {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    const name = `${first} ${last}`;
    const email =
      `${first}.${last}.${timestamp}.${i}@example.com`.toLowerCase();

    const user = await User.create({
      email,
      password: DEFAULT_USER_PASSWORD,
      name,
      role: "customer",
    });

    createdUsers.push(user);
  }

  return createdUsers;
}

async function recomputeItemStats(itemId) {
  const allReviews = await Review.find({ item: itemId });
  const reviewCount = allReviews.length;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          (allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10,
        ) / 10
      : 0;

  await Item.findByIdAndUpdate(itemId, {
    averageRating,
    reviewCount,
  });
}

async function seedReviews() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const newUsers = await createRandomUsers(USER_COUNT);
    console.log(`Created ${newUsers.length} random users`);

    const reviewers = await User.find({ role: "customer" }).select("name");

    if (!reviewers.length) {
      console.log("No customer users found; skipping review seeding.");
      await mongoose.connection.close();
      return;
    }

    const items = await Item.find({});
    if (!items.length) {
      console.log("No items found. Seed items first with: npm run seed");
      await mongoose.connection.close();
      return;
    }

    for (const item of items) {
      const existingCount = await Review.countDocuments({ item: item._id });
      const targetTotal =
        Math.max(MIN_REVIEWS_PER_ITEM, existingCount) +
        Math.max(0, randomInt(0, EXTRA_REVIEWS_MAX));
      const needed = Math.max(targetTotal - existingCount, 0);

      if (needed > 0) {
        const reviewsToInsert = [];
        const usedNames = new Set();
        const usedComments = new Set();

        for (const review of await Review.find({ item: item._id }).select(
          "reviewerName comment",
        )) {
          if (review.reviewerName) {
            usedNames.add(review.reviewerName);
          }
          if (review.comment) {
            usedComments.add(review.comment);
          }
        }

        for (let i = 0; i < needed; i += 1) {
          let reviewer = randomFrom(reviewers);
          let comment = randomFrom(COMMENTS);
          let attempts = 0;

          while (
            (usedNames.has(reviewer.name) ||
              usedComments.has(comment) ||
              comment === reviewer.name) &&
            attempts < 20
          ) {
            reviewer = randomFrom(reviewers);
            comment = randomFrom(COMMENTS);
            attempts += 1;
          }

          usedNames.add(reviewer.name);
          usedComments.add(comment);

          reviewsToInsert.push({
            item: item._id,
            reviewerName: reviewer.name,
            rating: randomRating(),
            comment,
          });
        }

        await Review.insertMany(reviewsToInsert);
        console.log(
          `Added ${needed} reviews for item: ${item.name} (${existingCount} -> ${existingCount + needed})`,
        );
      }

      await recomputeItemStats(item._id);
    }

    console.log("Review seeding complete.");
    mongoose.connection.close();
  } catch (err) {
    console.error("Seed reviews error:", err);
    process.exit(1);
  }
}

seedReviews();
