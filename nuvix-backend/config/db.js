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

    // Seed Default T-Shirt Styles
    const SeededLockSchema = new mongoose.Schema({ key: String });
    const SeededLock = mongoose.models.SeededLock || mongoose.model("SeededLock", SeededLockSchema);

    const lockExists = await SeededLock.findOne({ key: "tshirt-styles-seed" });
    if (!lockExists) {
      const TShirtStyle = require("../models/TShirtStyle");
      const styleCount = await TShirtStyle.countDocuments();
      if (styleCount === 0) {
        await TShirtStyle.insertMany([
          {
            name: "Male Normal T-Shirt",
            path: "/images/models/male normal t-shirt1.glb",
            type: "Crew Neck",
            gsms: ["180GSM", "220 GSM", "280GSM"],
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
            name: "Oversized T-Shirt",
            path: "/images/models/oversized t-sdirt1.glb",
            type: "Crew Neck",
            gsms: ["220 GSM", "280GSM", "320GSM"],
            colors: [
              { name: "White", value: "#ffffff" },
              { name: "Black", value: "#111827" },
              { name: "Beige", value: "#f5f5dc" },
              { name: "Light Grey", value: "#e5e7eb" },
              { name: "Pink", value: "#f472b6" }
            ]
          },
          {
            name: "Hoodie",
            path: "/images/models/t_shirt_hoodie.glb",
            type: "Polo",
            gsms: ["280GSM", "320GSM"],
            colors: [
              { name: "Black", value: "#111827" },
              { name: "Navy Blue", value: "#1e3a8a" },
              { name: "Violet", value: "#6d28d9" },
              { name: "Brown", value: "#78350f" },
              { name: "Red", value: "#dc2626" }
            ]
          }
        ]);
        console.log("Default T-Shirt Styles seeded successfully");
      }
      await SeededLock.create({ key: "tshirt-styles-seed" });
    }
  } catch (error) {
    console.error("Database connection or seeding failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;