const paymentService = require("../services/paymentService");

/**
 * Payment Controller handling Payment APIs (MVC Pattern)
 */

// POST /api/payment/create-checkout-session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { orderId, gateway = "stripe" } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const result = await paymentService.createCheckoutSession(orderId, gateway, frontendUrl);

    return res.status(200).json({
      success: true,
      message: "Payment checkout session created successfully",
      url: result.url,
      sessionId: result.sessionId,
      orderId: orderId,
      payhereParams: result.payhereParams
    });
  } catch (error) {
    console.error("createCheckoutSession Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create payment checkout session"
    });
  }
};

// POST /api/payment/webhook
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const gateway = req.query.gateway || "stripe";

    const result = await paymentService.processWebhookEvent(req.body, signature, gateway);

    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error("handleWebhook Controller Error:", error.message);
    return res.status(400).send(`Webhook Verification Error: ${error.message}`);
  }
};

// POST /api/payment/payhere-webhook
exports.handlePayHereWebhook = async (req, res) => {
  try {
    console.log("PayHere webhook notification received:", req.body);
    const result = await paymentService.processPayHereWebhook(req.body);
    return res.status(200).json({ received: true, success: true, ...result });
  } catch (error) {
    console.error("handlePayHereWebhook Controller Error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/payment/success
exports.paymentSuccess = async (req, res) => {
  try {
    const { session_id, order_id } = req.query;
    if (!session_id && !order_id) {
      return res.status(400).json({ success: false, message: "Session ID or Order ID parameter required" });
    }

    const fulfillmentResult = await paymentService.verifyAndFulfillPayment(session_id, order_id);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: fulfillmentResult.payment,
      order: fulfillmentResult.order
    });
  } catch (error) {
    console.error("paymentSuccess Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed"
    });
  }
};

// GET /api/payment/cancel
exports.paymentCancel = async (req, res) => {
  try {
    const { order_id } = req.query;
    return res.status(200).json({
      success: false,
      status: "Cancelled",
      message: "Customer cancelled payment checkout session",
      orderId: order_id || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payment/:paymentId
exports.getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
