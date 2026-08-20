const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in nuvix-backend/config/.env");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });
    console.log("MongoDB Connected");

    // Seed Default Admin Account
    const User = require("../models/User");
    const adminExists = await User.findOne({ role: "Admin" });

    if (!adminExists) {
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash("adminpassword123", 10);

      await User.create({
        name: "System Admin",
        email: "admin@printsphere.com",
        passwordHash,
        role: "Admin"
      });

      console.log("Default Admin account seeded: admin@printsphere.com / adminpassword123");
    }

    // Seed Default T-Shirt Styles
    const TShirtStyle = require("../models/TShirtStyle");
    const defaultStyles = [
      {
        name: "Men's T-Shirt",
        path: "/images/models/male normal t-shirt1.glb",
        type: "Crew Neck",
        gsms: ["GSM 180", "GSM 220", "GSM 280", "GSM 320"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1200.00 },
          { gsm: "GSM 220", price: 1500.00 },
          { gsm: "GSM 280", price: 1800.00 },
          { gsm: "GSM 320", price: 2000.00 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
          { name: "Charcoal", value: "#4b5563" },
          { name: "Navy Blue", value: "#1e3a8a" },
          { name: "Red", value: "#dc2626" },
          { name: "Gold", value: "#fbbf24" },
          { name: "Green", value: "#16a34a" }
        ]
      },
      {
        name: "Women's T-Shirt",
        path: "/images/models/female normal t-shirt.glb",
        type: "V-Neck",
        gsms: ["GSM 180", "GSM 220", "GSM 280", "GSM 320"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1400.00 },
          { gsm: "GSM 220", price: 1700.00 },
          { gsm: "GSM 280", price: 1900.00 },
          { gsm: "GSM 320", price: 2200.00 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
          { name: "Pink", value: "#f472b6" },
          { name: "Violet", value: "#6d28d9" },
          { name: "Beige", value: "#f5f5dc" },
          { name: "Light Blue", value: "#93c5fd" },
          { name: "Red", value: "#dc2626" }
        ]
      },
      {
        name: "Long Sleeve Shirt",
        path: "/images/models/long_sleeve_t-_shirt.glb",
        type: "Crew Neck",
        gsms: ["GSM 180", "GSM 220", "GSM 280"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1800.00 },
          { gsm: "GSM 220", price: 2100.00 },
          { gsm: "GSM 280", price: 2400.00 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
          { name: "Navy Blue", value: "#1e3a8a" },
          { name: "Charcoal", value: "#4b5563" },
          { name: "Green", value: "#16a34a" }
        ]
      },
      {
        name: "Oversized T-Shirt",
        path: "/images/models/oversized t-sdirt1.glb",
        type: "Crew Neck",
        gsms: ["GSM 180", "GSM 220", "GSM 280", "GSM 320"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1500.00 },
          { gsm: "GSM 220", price: 1800.00 },
          { gsm: "GSM 280", price: 2100.00 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
          { name: "Beige", value: "#f5f5dc" },
          { name: "Light Grey", value: "#e5e7eb" },
          { name: "Pink", value: "#f472b6" },
          { name: "Charcoal", value: "#4b5563" }
        ]
      },
      {
        name: "Hoodie",
        path: "/images/models/t_shirt_hoodie.glb",
        type: "Polo",
        gsms: ["GSM 180", "GSM 220", "GSM 280", "GSM 320"],
        gsmPrices: [
          { gsm: "GSM 180", price: 2500.00 },
          { gsm: "GSM 220", price: 2800.00 },
          { gsm: "GSM 280", price: 3200.00 }
        ],
        colors: [
          { name: "Black", value: "#111827" },
          { name: "Navy Blue", value: "#1e3a8a" },
          { name: "Violet", value: "#6d28d9" },
          { name: "Brown", value: "#78350f" },
          { name: "Red", value: "#dc2626" },
          { name: "Light Grey", value: "#e5e7eb" }
        ]
      },
      {
        name: "Classic FBX T-Shirt",
        path: "/images/models/T SHIRT.fbx",
        type: "Crew Neck",
        gsms: ["GSM 180", "GSM 220", "GSM 280"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1300.00 },
          { gsm: "GSM 220", price: 1600.00 },
          { gsm: "GSM 280", price: 1900.00 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
          { name: "Charcoal", value: "#4b5563" },
          { name: "Navy Blue", value: "#1e3a8a" },
          { name: "Red", value: "#dc2626" }
        ]
      }
    ];

    for (const styleData of defaultStyles) {
      const existing = await TShirtStyle.findOne({
        $or: [{ path: styleData.path }, { name: styleData.name }]
      });
      if (!existing) {
        await TShirtStyle.create(styleData);
      }
    }
    console.log("Default T-Shirt Styles verified and synced in database");
  } catch (error) {
    console.error("Database connection or seeding failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;