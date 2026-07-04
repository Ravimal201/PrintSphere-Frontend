const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("./models/User");

// Load Environment variables
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("ERROR: MONGO_URI is not defined in config/.env");
  process.exit(1);
}

async function seedAdmin() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(mongoURI);
    console.log("Connected successfully.");

    const adminEmail = "admin@printsphere.com";
    const adminPassword = "adminpassword123";

    console.log("Resetting / Creating default Admin account...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Find and update, or create if not exists
    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: "System Admin",
        passwordHash: passwordHash,
        role: "Admin",
        phone: "+94 77 123 4567"
      },
      { new: true, upsert: true }
    );

    console.log("\n✅ SUCCESS: Admin account configured successfully!");
    console.log("------------------------------------------------");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("------------------------------------------------");

    // Fetch and list all admin users in the system
    console.log("\nListing all accounts with Admin role in DB:");
    const admins = await User.find({ role: "Admin" }).select("name email role");
    admins.forEach((u, idx) => {
      console.log(`  ${idx + 1}. Name: "${u.name}", Email: "${u.email}"`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
