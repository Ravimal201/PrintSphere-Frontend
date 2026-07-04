const mongoose = require("mongoose");
const path = require("path");

// Load Environment variables
require("dotenv").config({ path: path.join(__dirname, "config", ".env") });

const mongoURI = process.env.MONGO_URI;

console.log("--- MongoDB Connection Diagnostic Tool ---");
console.log("Reading MONGO_URI from config/.env...");
if (!mongoURI) {
  console.error("ERROR: MONGO_URI is undefined or empty in config/.env!");
  console.log("Please check that config/.env contains: MONGO_URI=mongodb+srv://...");
  process.exit(1);
}

// Print parsed URI (masking password for safety)
try {
  const maskedURI = mongoURI.replace(/:([^@]+)@/, ":******@");
  console.log("Attempting to connect to:", maskedURI);
} catch (e) {
  console.log("Attempting to connect to the provided URI.");
}

async function testConnection() {
  try {
    // Attempt Mongoose connection with a short 8-second timeout for quick diagnostics
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log("\n✅ SUCCESS: Connected to MongoDB Atlas database successfully!");
    
    // Check if we can write/read a test document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.models.ConnectionTest || mongoose.model("ConnectionTest", testSchema);
    
    await TestModel.create({ test: "diagnostics" });
    await TestModel.deleteOne({ test: "diagnostics" });
    console.log("✅ SUCCESS: Read and Write privileges verified.");

    await mongoose.connection.close();
    console.log("Diagnostic complete. Connection closed safely.");
  } catch (error) {
    console.error("\n❌ CONNECTION FAILED!");
    console.error("Error Message:", error.message);
    console.error("\n--- troubleshooting guide ---");
    
    if (error.message.includes("querySrv ENOTFOUND")) {
      console.log("1. Check your Internet connection. The DNS resolver cannot locate the database cluster.");
    } else if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
      console.log("1. Double check your database USERNAME and PASSWORD inside config/.env.");
      console.log("2. Verify that special characters (like @, #, $) in the password are correctly URL-encoded.");
    } else if (error.message.includes("selection timeout") || error.name === "MongooseServerSelectionError") {
      console.log("1. Network Timeout. This is almost always due to an IP Whitelist issue on MongoDB Atlas!");
      console.log("   - Log in to your MongoDB Atlas dashboard (https://cloud.mongodb.com).");
      console.log("   - Go to 'Network Access' on the left menu.");
      console.log("   - Click 'Add IP Address' and select 'Allow Access from Anywhere' (0.0.0.0/0) or add your current IP address.");
    } else {
      console.log("1. Check MongoDB Atlas service status.");
      console.log("2. Ensure that your cluster is active and not paused.");
    }
    process.exit(1);
  }
}

testConnection();
