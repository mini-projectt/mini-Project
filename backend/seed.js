const mongoose = require("mongoose");
require("dotenv").config();
const Item = require("./models/Item");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/rentalapp";

const items = [
  {
    name: "Business Suit (Men's)",
    description:
      "Premium 3-piece business suit, perfect for interviews, weddings, and formal events. Available in Black, Navy, and Charcoal.",
    category: "Clothing",
    pricePerDay: 500,
    depositAmount: 2000,
    available: true,
    quantity: 5,
    imageUrl: "/images/mens%20suit.jpeg",
    condition: "Excellent",
  },
  {
    name: "Women's Formal Suit",
    description:
      "Elegant women's formal suit for corporate events, presentations, and weddings. Multiple sizes available.",
    category: "Clothing",
    pricePerDay: 450,
    depositAmount: 1800,
    available: true,
    quantity: 4,
    imageUrl: "/images/woman%20suit.jpg",
    imagePosition: "top",
    condition: "Excellent",
  },
  {
    name: "Electric Drilling Machine",
    description:
      "Heavy-duty 13mm electric drill with variable speed control. Ideal for home renovation, construction, and DIY projects.",
    category: "Power Tools",
    pricePerDay: 250,
    depositAmount: 1500,
    available: true,
    quantity: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400",
    condition: "Good",
  },
  {
    name: "Rotary Hammer Drill",
    description:
      "900W rotary hammer drill for concrete, brick, and masonry work. Includes 5-piece SDS drill bit set.",
    category: "Power Tools",
    pricePerDay: 400,
    depositAmount: 2500,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400",
    condition: "Good",
  },
  {
    name: "Submersible Water Pump (0.5 HP)",
    description:
      "Compact 0.5 HP submersible water pump for drainage, irrigation, and water transfer. Max flow: 2000L/hr.",
    category: "Pumps",
    pricePerDay: 350,
    depositAmount: 2000,
    available: true,
    quantity: 3,
    imageUrl: "/images/submersible-pump.webp",
    condition: "Good",
  },
  {
    name: "Centrifugal Water Pump (1 HP)",
    description:
      "Powerful 1 HP centrifugal pump for garden irrigation, construction sites, and water management.",
    category: "Pumps",
    pricePerDay: 550,
    depositAmount: 3000,
    available: true,
    quantity: 2,
    imageUrl: "/images/Centrifugal%20Water%20Pump%20(1%20HP).jpg",
    condition: "Good",
  },
  {
    name: "Angle Grinder",
    description:
      "2200W angle grinder for cutting, grinding, and polishing metal and masonry. Includes safety guard.",
    category: "Power Tools",
    pricePerDay: 200,
    depositAmount: 1200,
    available: true,
    quantity: 4,
    imageUrl: "/images/Angle%20Grinder.jpeg",
    condition: "Good",
  },
  {
    name: "Pressure Washer",
    description:
      "High-pressure washer (150 bar) for cleaning driveways, vehicles, and outdoor surfaces. Includes 5m hose.",
    category: "Cleaning Equipment",
    pricePerDay: 600,
    depositAmount: 3500,
    available: true,
    quantity: 2,
    imageUrl: "/images/Pressure%20Washer.jpeg",
    condition: "Excellent",
  },
  {
    name: "Cement Mixer",
    description:
      "160L electric cement mixer for small to medium construction jobs. Mixing drum capacity 160 litres.",
    category: "Construction",
    pricePerDay: 800,
    depositAmount: 4000,
    available: true,
    quantity: 2,
    imageUrl: "/images/Cement%20Mixer.jpeg",
    condition: "Good",
  },
  {
    name: "Generator (5 KVA)",
    description:
      "5 KVA portable petrol generator for power backup during events, construction, and outdoor activities.",
    category: "Electrical",
    pricePerDay: 1000,
    depositAmount: 5000,
    available: true,
    quantity: 2,
    imageUrl: "/images/Generator%20(5%20KVA).jpeg",
    condition: "Good",
  },
  {
    name: "Ladder (6ft Aluminum)",
    description:
      "Lightweight 6ft aluminum step ladder with non-slip feet. Load capacity 150 kg.",
    category: "Construction",
    pricePerDay: 150,
    depositAmount: 800,
    available: true,
    quantity: 5,
    imageUrl: "/images/Ladder%20(6ft%20Aluminum).jpeg",
    condition: "Good",
  },
  {
    name: "Wedding Sherwani",
    description:
      "Embroidered silk sherwani for weddings and cultural events. Comes with matching dupatta and pants.",
    category: "Clothing",
    pricePerDay: 800,
    depositAmount: 3000,
    available: true,
    quantity: 3,
    imageUrl: "/images/ws.jpeg",
    condition: "Excellent",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await Item.deleteMany({});
    console.log("Cleared existing items");

    const inserted = await Item.insertMany(items);
    console.log(`Seeded ${inserted.length} items successfully`);

    mongoose.connection.close();
    console.log("Done!");
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
