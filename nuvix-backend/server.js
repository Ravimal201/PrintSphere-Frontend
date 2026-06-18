const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

// Load Environment variables from the custom config path
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

const app = express();

// Middleware
app.use(express.json());

// Enable CORS
const cors = require("cors");
app.use(cors());

// Connect to MongoDB Database
connectDB();

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

// Mount API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/employee", employeeRoutes);

// Test Connection Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Healthy",
    message: "PrintSphere Backend Server is running",
    database: "Connected",
    timestamp: new Date()
  });
});

// Start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
