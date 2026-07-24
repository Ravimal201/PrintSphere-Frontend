const express = require("express");
const path = require("path");

// Load Environment variables from the custom config path before other startup code
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS
const cors = require("cors");
app.use(cors());

// Register all Mongoose models globally
require("./models/User");
require("./models/Product");
require("./models/Order");
require("./models/Inventory");
require("./models/PricingRules");
require("./models/CustomizedDesign");
require("./models/Notification");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerRoutes = require("./routes/managerRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// Mount API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/notifications", notificationRoutes);

// Test Connection Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Healthy",
    message: "PrintSphere Backend Server is running",
    database: "Connected",
    timestamp: new Date()
  });
});

// Connect to MongoDB Database and only start listening after successful connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
