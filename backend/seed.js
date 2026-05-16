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
  {
    name: "Cordless Impact Driver",
    description:
      "18V cordless impact driver with dual battery pack and fast charger. Ideal for furniture installation and repair work.",
    category: "Power Tools",
    pricePerDay: 300,
    depositAmount: 1800,
    available: true,
    quantity: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=400",
    condition: "Excellent",
  },
  {
    name: "Tile Cutter Machine",
    description:
      "Manual tile cutter for ceramic and vitrified tiles up to 24 inches. Suitable for home renovation projects.",
    category: "Construction",
    pricePerDay: 450,
    depositAmount: 2200,
    available: true,
    quantity: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400",
    condition: "Good",
  },
  {
    name: "Wet and Dry Vacuum Cleaner",
    description:
      "High suction vacuum cleaner for dust, debris, and liquid spills. Best for deep home and office cleaning.",
    category: "Cleaning Equipment",
    pricePerDay: 500,
    depositAmount: 2600,
    available: true,
    quantity: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1594224457860-2fb4f4b58b89?w=400",
    condition: "Excellent",
  },
  {
    name: "Industrial Floor Scrubber",
    description:
      "Electric floor scrubber with water tank and rotating brushes for large indoor spaces and commercial cleaning.",
    category: "Cleaning Equipment",
    pricePerDay: 900,
    depositAmount: 4500,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400",
    condition: "Good",
  },
  {
    name: "Portable Air Compressor",
    description:
      "Oil-free air compressor for spray painting, inflation, and pneumatic tools. Includes hose and nozzle kit.",
    category: "Power Tools",
    pricePerDay: 550,
    depositAmount: 2800,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400",
    condition: "Good",
  },
  {
    name: "Inverter Welding Machine",
    description:
      "200A inverter welding machine for steel fabrication, gates, and repair jobs. Includes clamp and cable set.",
    category: "Electrical",
    pricePerDay: 950,
    depositAmount: 5000,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1566241978974-df6f3f8f6f65?w=400",
    condition: "Good",
  },
  {
    name: "Diesel Water Pump (2 HP)",
    description:
      "2 HP diesel water pump for farm irrigation and site dewatering with high discharge capacity.",
    category: "Pumps",
    pricePerDay: 700,
    depositAmount: 3800,
    available: true,
    quantity: 2,
    imageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=400",
    condition: "Good",
  },
  {
    name: "Designer Bridal Lehenga",
    description:
      "Premium bridal lehenga set with embroidered blouse and dupatta, suitable for wedding and reception events.",
    category: "Clothing",
    pricePerDay: 1200,
    depositAmount: 6000,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
    condition: "Excellent",
  },
  {
    name: "Laser Level with Tripod",
    description:
      "Self-leveling laser level with aluminum tripod for accurate alignment in interior work and false ceiling setup.",
    category: "Construction",
    pricePerDay: 350,
    depositAmount: 1700,
    available: true,
    quantity: 3,
    imageUrl: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400",
    condition: "Excellent",
  },
  {
    name: "LED Flood Light Tower",
    description:
      "Portable LED flood light tower for outdoor events, construction zones, and emergency night work.",
    category: "Electrical",
    pricePerDay: 850,
    depositAmount: 4200,
    available: true,
    quantity: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=400",
    condition: "Good",
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
