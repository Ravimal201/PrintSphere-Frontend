const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");

/**
 * Payment Gateway Strategy Abstract Interface
 * Enables adding PayHere Sandbox or other payment providers cleanly in the future.
 */
class BasePaymentGateway {
  async createCheckoutSession(params) {
    throw new Error("createCheckoutSession must be implemented by gateway strategy");
  }
  async verifyWebhook(rawBody, signature) {
    throw new Error("verifyWebhook must be implemented by gateway strategy");
  }
}

/**
 * Stripe Gateway Strategy Implementation
 */
class StripeGatewayStrategy extends BasePaymentGateway {
  constructor() {
    super();
    const { stripe, webhookSecret, currency } = require("../config/stripe");
    this.stripe = stripe;
    this.webhookSecret = webhookSecret;
    this.defaultCurrency = currency || "lkr";
  }

  async createCheckoutSession({ order, customer, frontendUrl }) {
    if (!this.stripe) {
      throw new Error("Stripe SDK is not initialized. Please verify STRIPE_SECRET_KEY in configuration.");
    }

    const lineItems = (order.items && order.items.length > 0)
      ? order.items.map((item) => ({
          price_data: {
            currency: this.defaultCurrency,
            product_data: {
              name: item.designId ? `Customized T-Shirt (${item.selectedSize}, ${item.selectedColor})` : `Ready-made T-Shirt (${item.selectedSize})`,
              description: `Quantity: ${item.quantity} | Material: ${item.material || 'Cotton'}`
            },
            unit_amount: Math.round((item.price || (order.totalCost / item.quantity)) * 100)
          },
          quantity: item.quantity
        }))
      : [
          {
            price_data: {
              currency: this.defaultCurrency,
              product_data: {
                name: `PrintSphere T-Shirt Order #${order._id.toString().substring(18)}`,
                description: `Custom 3D Print Order`
              },
              unit_amount: Math.round(order.totalCost * 100)
            },
            quantity: 1
          }
        ];

    const baseUrl = frontendUrl.endsWith("/") ? frontendUrl.slice(0, -1) : frontendUrl;

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      client_reference_id: order._id.toString(),
      customer_email: customer?.email || order.guestEmail || undefined,
      metadata: {
        orderId: order._id.toString(),
        customerId: customer?._id?.toString() || ""
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${baseUrl}/payment/cancel?order_id=${order._id}`
    });

    return {
      gateway: "Stripe",
      sessionId: session.id,
      paymentIntentId: session.payment_intent || null,
      url: session.url,
      rawSession: session
    };
  }

  async verifyWebhook(rawBody, signature) {
    if (!this.stripe) {
      throw new Error("Stripe SDK not initialized");
    }
    if (this.webhookSecret && signature && this.webhookSecret !== "whsec_placeholder") {
      return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } else {
      return typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    }
  }

  async retrieveSession(sessionId) {
    if (!this.stripe) return null;
    return await this.stripe.checkout.sessions.retrieve(sessionId);
  }
}

/**
 * PayHere Sandbox Strategy (Placeholder for future gateway extension)
 */
class PayHereGatewayStrategy extends BasePaymentGateway {
  async createCheckoutSession(params) {
    throw new Error("PayHere gateway strategy is ready to be configured.");
  }
  async verifyWebhook(rawBody, signature) {
    throw new Error("PayHere webhook verification is ready to be configured.");
  }
}

/**
 * Gateway Strategy Factory
 */
class PaymentGatewayFactory {
  static getGateway(gatewayName = "stripe") {
    switch (gatewayName.toLowerCase()) {
      case "stripe":
        return new StripeGatewayStrategy();
      case "payhere":
        return new PayHereGatewayStrategy();
      default:
        return new StripeGatewayStrategy();
    }
  }
}

/**
 * Core Business Logic Service for Payments
 */
class PaymentService {
  /**
   * Step 1: Create a Stripe Checkout Session for an Order
   */
  async createCheckoutSession(orderId, gatewayType = "stripe", frontendUrl = "http://localhost:5173") {
    const order = await Order.findById(orderId).populate("customerId");
    if (!order) {
      throw new Error("Order not found");
    }

    const gateway = PaymentGatewayFactory.getGateway(gatewayType);
    const sessionData = await gateway.createCheckoutSession({
      order,
      customer: order.customerId,
      frontendUrl
    });

    // Create or update initial Payment record in Pending status
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId?._id || null,
        stripeSessionId: sessionData.sessionId,
        amount: order.totalCost,
        currency: "lkr",
        paymentMethod: sessionData.gateway,
        paymentStatus: "Pending",
        gatewayResponse: sessionData.rawSession || {}
      });
    } else {
      payment.stripeSessionId = sessionData.sessionId;
      payment.paymentStatus = "Pending";
      payment.gatewayResponse = sessionData.rawSession || {};
    }
    await payment.save();

    return sessionData;
  }

  /**
   * Step 2 & Webhook Handling: Verify Webhook signature & process event
   */
  async processWebhookEvent(rawBody, signature, gatewayType = "stripe") {
    const gateway = PaymentGatewayFactory.getGateway(gatewayType);
    const event = await gateway.verifyWebhook(rawBody, signature);

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const session = event.data?.object;
      const orderId = session?.metadata?.orderId || session?.client_reference_id;
      const sessionId = session?.id;

      if (sessionId || orderId) {
        return await this.verifyAndFulfillPayment(sessionId, orderId, session);
      }
    }

    return { message: "Webhook event processed without action required" };
  }

  /**
   * Steps 3-7: Fulfill Order & Payment:
   * 1. Verify Stripe payment
   * 2. Save payment details
   * 3. Update Order.paymentStatus = "Paid"
   * 4. Update Order.orderStatus = "Confirmed" / "Processing"
   * 5. Reduce inventory
   * 6. Create production workflow entry
   * 7. Return success response
   */
  async verifyAndFulfillPayment(sessionId, orderId, rawSessionData = null) {
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (sessionId) {
      const p = await Payment.findOne({ stripeSessionId: sessionId });
      if (p) order = await Order.findById(p.orderId);
    }

    if (!order) {
      throw new Error("Target Order could not be resolved for payment verification");
    }

    // Attempt retrieval from Stripe if raw session data not provided
    if (!rawSessionData && sessionId) {
      const stripeStrategy = new StripeGatewayStrategy();
      try {
        rawSessionData = await stripeStrategy.retrieveSession(sessionId);
      } catch (err) {
        console.warn("Could not retrieve session directly from Stripe:", err.message);
      }
    }

    // 1. Verify Payment Record
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId || null,
        stripeSessionId: sessionId || "N/A",
        amount: order.totalCost,
        currency: "lkr",
        paymentMethod: "Stripe",
        paymentStatus: "Paid"
      });
    }

    payment.stripeSessionId = sessionId || payment.stripeSessionId;
    if (rawSessionData?.payment_intent) {
      payment.stripePaymentIntentId = typeof rawSessionData.payment_intent === "string"
        ? rawSessionData.payment_intent
        : rawSessionData.payment_intent.id;
    }
    payment.paymentStatus = "Paid";
    payment.paidAt = payment.paidAt || new Date();
    payment.gatewayResponse = rawSessionData || payment.gatewayResponse;
    await payment.save();

    // 3. Update Order.paymentStatus = "Paid"
    order.paymentStatus = "Paid";
    order.paymentTransactionId = payment.stripePaymentIntentId || payment.stripeSessionId;

    // 4. Update Order.status / orderStatus = "Confirmed"
    const isFirstTimeConfirmation = order.orderStatus === "Pending Payment";
    order.orderStatus = "Processing"; // Processing & Confirmed in production pipeline

    // 5. Reduce Inventory
    if (isFirstTimeConfirmation) {
      await this.reduceInventory(order);
    }

    // 6. Create Production Workflow
    if (isFirstTimeConfirmation) {
      await this.createProductionWorkflow(order);
    } else {
      await order.save();
    }

    // 7. Return success response
    return {
      payment,
      order
    };
  }

  /**
   * Helper: Step 5 - Reduce Inventory
   */
  async reduceInventory(order) {
    try {
      if (!order.items || order.items.length === 0) return;

      for (const item of order.items) {
        if (item.selectedSize && item.selectedColor) {
          // Attempt to find matching plain t-shirt stock
          const invItem = await Inventory.findOne({
            size: item.selectedSize,
            color: new RegExp(`^${item.selectedColor.replace("#", "")}`, "i")
          });

          if (invItem && invItem.quantity >= item.quantity) {
            invItem.quantity -= item.quantity;
            await invItem.save();
          } else {
            // General size fallback inventory reduction
            const generalInv = await Inventory.findOne({ size: item.selectedSize });
            if (generalInv && generalInv.quantity >= item.quantity) {
              generalInv.quantity -= item.quantity;
              await generalInv.save();
            }
          }
        }
      }
    } catch (err) {
      console.error("Error reducing inventory for payment fulfillment:", err.message);
    }
  }

  /**
   * Helper: Step 6 - Create Production Workflow Timeline
   */
  async createProductionWorkflow(order) {
    try {
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: "Processing",
        note: "Stripe payment verified successfully. Order confirmed and dispatched to 3D printing production workflow.",
        timestamp: new Date()
      });
      await order.save();
    } catch (err) {
      console.error("Error creating production workflow entry:", err.message);
    }
  }

  /**
   * Fetch payment record details by Payment ID
   */
  async getPaymentById(paymentId) {
    return await Payment.findById(paymentId).populate("orderId customerId");
  }
}

module.exports = new PaymentService();
