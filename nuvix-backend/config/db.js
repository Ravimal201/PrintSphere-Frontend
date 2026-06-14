const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
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
  } catch (error) {
    console.error("Database connection or seeding failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;