const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// POST /api/payment/webhook (Express raw body middleware for Stripe signature verification)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", paymentController.createCheckoutSession);

// GET /api/payment/success
router.get("/success", paymentController.paymentSuccess);

// GET /api/payment/cancel
router.get("/cancel", paymentController.paymentCancel);

// GET /api/payment/:paymentId
router.get("/:paymentId", paymentController.getPaymentById);

module.exports = router;
