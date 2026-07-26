const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

// Load Environment variables from the custom config path
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

const app = express();

// Stripe Webhook mounted before express.json() to preserve the raw binary request body required for signature verification
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    require("./controllers/paymentController").handleWebhook(req, res, next);
  }
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
require("./models/Payment");


// Route Imports
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const managerRoutes = require("./routes/managerRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Mount API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);

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
