const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

// Import models
const User = require("./models/User");
const Order = require("./models/Order");
const Payment = require("./models/Payment");
const CustomizedDesign = require("./models/CustomizedDesign");
const Notification = require("./models/Notification");
const UserActivity = require("./models/UserActivity");
const Review = require("./models/Review");
const ContactMessage = require("./models/ContactMessage");
const Product = require("./models/Product");
const Inventory = require("./models/Inventory");
const PricingRules = require("./models/PricingRules");
const TShirtStyle = require("./models/TShirtStyle");

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("ERROR: MONGO_URI is not defined in config/.env");
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("Connected successfully.\n");

    const userCount = await User.countDocuments();
    console.log(`🔒 PRESERVED: Users collection (${userCount} user accounts will NOT be deleted)\n`);

    console.log("Cleaning database data (Orders, Payments, Products, Inventory, Designs, etc.)...");

    // 1. Orders & Payments
    const ordersDeleted = await Order.deleteMany({});
    console.log(`  ✓ Orders deleted: ${ordersDeleted.deletedCount}`);

    const paymentsDeleted = await Payment.deleteMany({});
    console.log(`  ✓ Payments deleted: ${paymentsDeleted.deletedCount}`);

    // 2. Products & Inventory
    const productsDeleted = await Product.deleteMany({});
    console.log(`  ✓ Products deleted: ${productsDeleted.deletedCount}`);

    const inventoryDeleted = await Inventory.deleteMany({});
    console.log(`  ✓ Inventory records deleted: ${inventoryDeleted.deletedCount}`);

    const pricingDeleted = await PricingRules.deleteMany({});
    console.log(`  ✓ Pricing Rules deleted: ${pricingDeleted.deletedCount}`);

    const stylesDeleted = await TShirtStyle.deleteMany({});
    console.log(`  ✓ TShirt Styles deleted: ${stylesDeleted.deletedCount}`);

    // 3. Custom Designs & Notifications
    const designsDeleted = await CustomizedDesign.deleteMany({});
    console.log(`  ✓ Customized Designs deleted: ${designsDeleted.deletedCount}`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`  ✓ Notifications deleted: ${notificationsDeleted.deletedCount}`);

    // 4. User Activities & Logs
    const activitiesDeleted = await UserActivity.deleteMany({});
    console.log(`  ✓ User Activities deleted: ${activitiesDeleted.deletedCount}`);

    // 5. Reviews & Contact Messages
    const reviewsDeleted = await Review.deleteMany({});
    console.log(`  ✓ Reviews deleted: ${reviewsDeleted.deletedCount}`);

    const contactDeleted = await ContactMessage.deleteMany({});
    console.log(`  ✓ Contact Messages deleted: ${contactDeleted.deletedCount}`);

    const remainingUsers = await User.countDocuments();
    console.log(`\n✅ Database cleaned successfully! All data removed except ${remainingUsers} User accounts.`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error during database cleanup:", error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

cleanDatabase();
