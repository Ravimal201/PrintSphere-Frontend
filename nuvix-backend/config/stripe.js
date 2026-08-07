const path = require("path");

// Load environment variables from backend config path
require("dotenv").config({ path: path.join(__dirname, ".env") });
if (!process.env.STRIPE_SECRET_KEY) {
  require("dotenv").config({ path: path.join(__dirname, "..", "config", ".env") });
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder";

// Safely require and initialize Stripe SDK
let stripeInstance = null;
try {
  const Stripe = require("stripe");
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16"
  });
} catch (err) {
  console.warn("Stripe SDK initialization warning:", err.message);
  stripeInstance = null;
}

module.exports = {
  stripe: stripeInstance,
  stripeSecretKey,
  webhookSecret,
  currency: (process.env.PAYMENT_CURRENCY || "lkr").toLowerCase()
};
