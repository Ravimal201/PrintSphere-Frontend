const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "nuvix-backend", "config", ".env") });
const mongoose = require("mongoose");
const connectDB = require("./nuvix-backend/config/db");

// Load models
require("./nuvix-backend/models/User");
require("./nuvix-backend/models/Product");
require("./nuvix-backend/models/Order");
require("./nuvix-backend/models/Inventory");
require("./nuvix-backend/models/PricingRules");
require("./nuvix-backend/models/CustomizedDesign");
require("./nuvix-backend/models/Notification");
require("./nuvix-backend/models/Payment");

const paymentService = require("./nuvix-backend/services/paymentService");
const Order = mongoose.model("Order");

async function test() {
  try {
    await connectDB();
    console.log("DB connected successfully.");

    // Create a mock user
    const User = mongoose.model("User");
    let user = await User.findOne({ email: "testuser@example.com" });
    if (!user) {
      user = await User.create({
        name: "Test User",
        email: "testuser@example.com",
        passwordHash: "dummyhash",
        role: "Customer"
      });
    }

    // Helper to create valid pending order
    const createOrder = async () => {
      const order = new Order({
        customerId: user._id,
        items: [{
          selectedSize: "M",
          selectedColor: "#ffffff",
          price: 1500,
          quantity: 1,
          material: "Standard cotton"
        }],
        subtotal: 1500,
        totalCost: 1500,
        shippingAddress: {
          street: "123 Test St",
          city: "Colombo",
          country: "Sri Lanka"
        },
        paymentStatus: "Pending"
      });
      return await order.save();
    };

    // 1. Test Insufficient Funds Card Failure
    console.log("\n--- Testing Insufficient Funds ---");
    const order1 = await createOrder();
    try {
      await paymentService.processCardPayment(order1._id, {
        cardNumber: "4024007194349121",
        cardholderName: "Alice Cooper",
        expiryDate: "12/28",
        cvv: "123"
      });
      console.log("FAIL: Expected payment to fail, but it succeeded!");
    } catch (err) {
      console.log("PASS: Payment failed as expected:", err.message);
    }
    await Order.findByIdAndDelete(order1._id);

    // 2. Test Successful Card Payment
    console.log("\n--- Testing Successful Card Payment ---");
    const order2 = await createOrder();
    const result = await paymentService.processCardPayment(order2._id, {
      cardNumber: "4111222233334444", // Normal valid card
      cardholderName: "Alice Cooper",
      expiryDate: "12/28",
      cvv: "123",
      brand: "VISA"
    });
    console.log("PASS: Payment succeeded. Result:", JSON.stringify(result.payment, null, 2));
    await Order.findByIdAndDelete(order2._id);

  } catch (error) {
    console.error("TEST FAILED:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDB connection closed.");
  }
}

test();
