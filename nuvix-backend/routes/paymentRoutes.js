const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");


// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", paymentController.createCheckoutSession);

// POST /api/payment/process-account-payment
router.post("/process-account-payment", paymentController.processAccountPayment);

// GET /api/payment/success
router.get("/success", paymentController.paymentSuccess);

// GET /api/payment/cancel
router.get("/cancel", paymentController.paymentCancel);

// POST /api/payment/payhere-webhook
router.post("/payhere-webhook", paymentController.handlePayHereWebhook);

// GET /api/payment/:paymentId
router.get("/:paymentId", paymentController.getPaymentById);

module.exports = router;
