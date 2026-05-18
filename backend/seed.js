const mongoose = require("mongoose");
require("dotenv").config();
const Item = require("./models/Item");
const User = require("./models/User");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/rentalapp";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

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
    imageUrl: "/images/Cordless%20Impact%20Driver.jpeg",
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
    imageUrl: "/images/Tile%20Cutter%20Machine.jpeg",
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
    imageUrl: "/images/Wet%20and%20Dry%20Vacuum%20Cleaner.jpeg",
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
    imageUrl: "/images/Industrial%20Floor%20Scrubber.jpeg",
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
    imageUrl: "/images/Portable%20Air%20Compressor.jpeg",
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
    imageUrl: "/images/Inverter%20Welding%20Machine.jpeg",
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
    imageUrl: "/images/Diesel%20Water%20Pump%20(2%20HP).jpeg",
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
    imageUrl: "/images/Designer%20Bridal%20Lehenga.jpeg",
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
    imageUrl: "/images/Laser%20Level%20with%20Tripod.jpeg",
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
    imageUrl: "/images/LED%20Flood%20Light%20Tower.jpeg",
    condition: "Good",
  },
  {
    name: "Safety Jacket (Hi-Vis)",
    description:
      "High-visibility safety jacket with reflective stripes for night shifts and roadside work.",
    category: "Clothing",
    pricePerDay: 120,
    depositAmount: 600,
    available: true,
    quantity: 10,
    imageUrl: "/images/Safety%20Jacket%20(Hi-Vis).jpeg",
    condition: "Good",
  },
  {
    name: "Lab Coat (Unisex)",
    description:
      "Durable lab coat for workshops, labs, and cleaning staff. Multiple sizes available.",
    category: "Clothing",
    pricePerDay: 100,
    depositAmount: 500,
    available: true,
    quantity: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    condition: "Good",
  },
  {
    name: "Chef Uniform Set",
    description:
      "Chef coat and apron set for catering, events, and commercial kitchens.",
    category: "Clothing",
    pricePerDay: 180,
    depositAmount: 800,
    available: true,
    quantity: 6,
    imageUrl: "/images/Chef%20Uniform%20Set.jpeg",
    condition: "Excellent",
  },
  {
    name: "Winter Jacket (Thermal)",
    description: "Insulated thermal jacket for outdoor crews in cold weather.",
    category: "Clothing",
    pricePerDay: 160,
    depositAmount: 700,
    available: true,
    quantity: 6,
    imageUrl: "/images/Winter%20Jacket%20(Thermal).jpeg",
    condition: "Good",
  },
  {
    name: "Traditional Kurta Set",
    description: "Classic kurta set for cultural events and ceremonies.",
    category: "Clothing",
    pricePerDay: 300,
    depositAmount: 1200,
    available: true,
    quantity: 5,
    imageUrl: "/images/Traditional%20Kurta%20Set%20.webp",
    condition: "Excellent",
  },
  {
    name: "Circular Saw (7-1/4 inch)",
    description: "High-power circular saw for wood cutting and framing work.",
    category: "Power Tools",
    pricePerDay: 350,
    depositAmount: 2000,
    available: true,
    quantity: 3,
    imageUrl: "/images/Circular%20Saw%20(7-1:4%20inch).jpeg",
    condition: "Good",
  },
  {
    name: "Jigsaw (Variable Speed)",
    description:
      "Precision jigsaw for curved cuts in wood, plastic, and metal.",
    category: "Power Tools",
    pricePerDay: 280,
    depositAmount: 1600,
    available: true,
    quantity: 3,
    imageUrl: "/images/Jigsaw%20(Variable%20Speed)%20.jpeg",
    condition: "Good",
  },
  {
    name: "Heat Gun",
    description:
      "Dual temperature heat gun for paint removal, shrink wrapping, and repairs.",
    category: "Power Tools",
    pricePerDay: 220,
    depositAmount: 1200,
    available: true,
    quantity: 4,
    imageUrl: "/images/Heat%20Gun.jpeg",
    condition: "Good",
  },
  {
    name: "Rotary Tool Kit",
    description: "Multi-purpose rotary tool with 100-piece accessory kit.",
    category: "Power Tools",
    pricePerDay: 260,
    depositAmount: 1400,
    available: true,
    quantity: 4,
    imageUrl: "/images/Rotary%20Tool%20Kit.jpeg",
    condition: "Excellent",
  },
  {
    name: "Electric Planer",
    description: "Power planer for smoothing doors and wooden surfaces.",
    category: "Power Tools",
    pricePerDay: 300,
    depositAmount: 1700,
    available: true,
    quantity: 2,
    imageUrl: "/images/Electric%20Planer%20.jpeg",
    condition: "Good",
  },
  {
    name: "Water Transfer Pump (1.5 HP)",
    description: "High flow transfer pump for dewatering sites and irrigation.",
    category: "Pumps",
    pricePerDay: 620,
    depositAmount: 3200,
    available: true,
    quantity: 2,
    imageUrl: "/images/Water%20Transfer%20Pump%20(1.5%20HP.jpeg",
    condition: "Good",
  },
  {
    name: "Sump Pump (0.75 HP)",
    description: "Compact sump pump for basement drainage and water removal.",
    category: "Pumps",
    pricePerDay: 420,
    depositAmount: 2100,
    available: true,
    quantity: 3,
    imageUrl: "/images/Sump%20Pump%20(0.75%20HP).jpeg",
    condition: "Good",
  },
  {
    name: "Scaffolding Set (10 ft)",
    description:
      "Modular scaffolding set suitable for painting, plaster, and maintenance.",
    category: "Construction",
    pricePerDay: 900,
    depositAmount: 4500,
    available: true,
    quantity: 2,
    imageUrl: "/images/Scaffolding%20Set%20(10%20ft).webp",
    condition: "Good",
  },
  {
    name: "Concrete Vibrator",
    description:
      "Electric concrete vibrator to remove air pockets and improve concrete strength.",
    category: "Construction",
    pricePerDay: 700,
    depositAmount: 3500,
    available: true,
    quantity: 2,
    imageUrl: "/images/Concrete%20Vibrator.jpeg",
    condition: "Good",
  },
  {
    name: "Paint Sprayer",
    description:
      "Airless paint sprayer for faster wall and metal painting projects.",
    category: "Construction",
    pricePerDay: 600,
    depositAmount: 3000,
    available: true,
    quantity: 3,
    imageUrl: "/images/Paint%20Sprayer.jpeg",
    condition: "Excellent",
  },
  {
    name: "Wheelbarrow (Heavy Duty)",
    description:
      "Heavy-duty wheelbarrow for construction debris and material transport.",
    category: "Construction",
    pricePerDay: 180,
    depositAmount: 900,
    available: true,
    quantity: 5,
    imageUrl: "/images/Wheelbarrow%20(Heavy%20Duty).jpeg",
    condition: "Good",
  },
  {
    name: "Tile Adhesive Mixer",
    description: "Mixer drill attachment for tile adhesive and plaster mixing.",
    category: "Construction",
    pricePerDay: 240,
    depositAmount: 1200,
    available: true,
    quantity: 4,
    imageUrl: "/images/Tile%20Adhesive%20Mixer%20.jpeg",
    condition: "Good",
  },
  {
    name: "Extension Cable Reel (30m)",
    description: "Heavy-duty extension reel with thermal cut-off protection.",
    category: "Electrical",
    pricePerDay: 150,
    depositAmount: 700,
    available: true,
    quantity: 6,
    imageUrl: "/images/Extension%20Cable%20Reel%20(30m).jpeg",
    condition: "Good",
  },
  {
    name: "Portable Inverter (1 KVA)",
    description:
      "Silent portable inverter for backup power during small events.",
    category: "Electrical",
    pricePerDay: 500,
    depositAmount: 2400,
    available: true,
    quantity: 3,
    imageUrl: "/images/Portable%20Inverter%20(1%20KVA).jpeg",
    condition: "Excellent",
  },
  {
    name: "Site Work Light (LED Panel)",
    description:
      "Bright LED work light panel for indoor construction lighting.",
    category: "Electrical",
    pricePerDay: 260,
    depositAmount: 1300,
    available: true,
    quantity: 4,
    imageUrl: "/images/Site%20Work%20Light%20(LED%20Panel).jpeg",
    condition: "Good",
  },
  {
    name: "Power Distribution Box",
    description:
      "Portable power distribution box with multiple outlets for site equipment.",
    category: "Electrical",
    pricePerDay: 320,
    depositAmount: 1600,
    available: true,
    quantity: 3,
    imageUrl: "/images/Power%20Distribution%20Box.jpeg",
    condition: "Good",
  },
  {
    name: "Carpet Cleaner",
    description:
      "Deep-cleaning carpet extractor suitable for offices and large rooms.",
    category: "Cleaning Equipment",
    pricePerDay: 650,
    depositAmount: 3200,
    available: true,
    quantity: 2,
    imageUrl: "/images/Carpet%20Cleaner.jpeg",
    condition: "Good",
  },
  {
    name: "Steam Cleaner",
    description:
      "High-pressure steam cleaner for sanitizing floors and surfaces.",
    category: "Cleaning Equipment",
    pricePerDay: 500,
    depositAmount: 2500,
    available: true,
    quantity: 3,
    imageUrl: "/images/Steam%20Cleaner.jpeg",
    condition: "Excellent",
  },
  {
    name: "Leaf Blower",
    description:
      "Portable leaf blower for outdoor cleaning and garden maintenance.",
    category: "Cleaning Equipment",
    pricePerDay: 220,
    depositAmount: 1100,
    available: true,
    quantity: 4,
    imageUrl: "/images/Leaf%20Blower.jpeg",
    condition: "Good",
  },
  {
    name: "Floor Polisher",
    description: "Heavy-duty floor polisher for marble and tiled surfaces.",
    category: "Cleaning Equipment",
    pricePerDay: 700,
    depositAmount: 3400,
    available: true,
    quantity: 2,
    imageUrl: "/images/Floor%20Polisher.jpeg",
    condition: "Good",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let adminUser = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
      adminUser = new User({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Admin",
        role: "admin",
      });
    } else {
      adminUser.name = adminUser.name || "Admin";
      adminUser.role = "admin";
      adminUser.password = ADMIN_PASSWORD;
    }

    await adminUser.save();
    console.log("Admin user ready");

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
