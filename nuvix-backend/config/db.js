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

    // Default Admin check is kept, style seeding is now handled on demand via seed_styles.js
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;