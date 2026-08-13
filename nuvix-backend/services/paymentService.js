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
    const { stripeSecretKey } = require("../config/stripe");
    const isMockMode = !this.stripe || !stripeSecretKey || stripeSecretKey === "sk_test_placeholder";

    const baseUrl = frontendUrl.endsWith("/") ? frontendUrl.slice(0, -1) : frontendUrl;

    if (isMockMode) {
      console.log("Stripe Key not configured or placeholder detected. Running in Sandbox Mock Mode.");
      return {
        gateway: "Stripe",
        sessionId: `mock_stripe_session_${order._id}`,
        paymentIntentId: `mock_payment_intent_${order._id}`,
        url: `${baseUrl}/payment/success?session_id=mock_stripe_session_${order._id}&order_id=${order._id}`,
        rawSession: { id: `mock_stripe_session_${order._id}`, payment_intent: `mock_payment_intent_${order._id}`, mock: true }
      };
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
  constructor() {
    super();
    const payhereConfig = require("../config/payhere");
    this.merchantId = payhereConfig.merchantId;
    this.merchantSecret = payhereConfig.merchantSecret;
    this.isSandbox = payhereConfig.isSandbox;
    this.defaultCurrency = payhereConfig.defaultCurrency;
    this.generateCheckoutHash = payhereConfig.generateCheckoutHash;
    this.verifyCallbackSignature = payhereConfig.verifyCallbackSignature;
  }

  async createCheckoutSession({ order, customer, frontendUrl }) {
    const hash = this.generateCheckoutHash(order._id.toString(), order.totalCost, this.defaultCurrency);
    const amountStr = Number(order.totalCost).toFixed(2);
    const itemsName = order.items && order.items.length > 0
      ? order.items.map(i => i.selectedSize ? `T-Shirt (${i.selectedSize})` : "T-Shirt").join(", ")
      : `Order #${order._id.toString().substring(18)}`;

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

    const payhereParams = {
      sandbox: this.isSandbox,
      merchant_id: this.merchantId,
      return_url: `${frontendUrl}/payment/success?order_id=${order._id}&gateway=payhere`,
      cancel_url: `${frontendUrl}/payment/cancel?order_id=${order._id}`,
      notify_url: `${backendUrl}/api/payment/payhere-webhook`,
      order_id: order._id.toString(),
      items: itemsName.substring(0, 255),
      amount: amountStr,
      currency: this.defaultCurrency,
      hash: hash,
      first_name: customer?.firstName || "Guest",
      last_name: customer?.lastName || "Customer",
      email: customer?.email || order.guestEmail || "guest@example.com",
      phone: customer?.phone || "0771234567",
      address: order.shippingAddress?.street || "No. 1, Galle Road",
      city: order.shippingAddress?.city || "Colombo",
      country: order.shippingAddress?.country || "Sri Lanka"
    };

    return {
      gateway: "PayHere",
      sessionId: order._id.toString(),
      paymentIntentId: null,
      url: null,
      payhereParams: payhereParams,
      rawSession: payhereParams
    };
  }

  async verifyWebhook(rawBody, signature) {
    return this.verifyCallbackSignature(rawBody);
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
    const paymentCurrency = (sessionData.payhereParams?.currency || "lkr").toLowerCase();
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId?._id || null,
        stripeSessionId: sessionData.sessionId,
        amount: order.totalCost,
        currency: paymentCurrency,
        paymentMethod: sessionData.gateway,
        paymentStatus: "Pending",
        gatewayResponse: sessionData.rawSession || {}
      });
    } else {
      payment.stripeSessionId = sessionData.sessionId;
      payment.paymentMethod = sessionData.gateway;
      payment.currency = paymentCurrency;
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
   * Process PayHere Status Webhook Notifications
   */
  async processPayHereWebhook(body) {
    const payhereConfig = require("../config/payhere");
    
    // 1. Verify Callback Signature
    const isValid = payhereConfig.verifyCallbackSignature(body);
    if (!isValid) {
      throw new Error("PayHere webhook signature verification failed");
    }

    const statusCode = Number(body.status_code);
    const orderId = body.order_id;
    const paymentId = body.payment_id;

    if (statusCode === 2) {
      // Payment successful - fulfill order
      return await this.verifyAndFulfillPayment(paymentId, orderId, body, "PayHere");
    } else {
      // Handle other status states
      const order = await Order.findById(orderId);
      if (order) {
        let payment = await Payment.findOne({ orderId: order._id });
        const statusMap = {
          "0": "Pending",
          "-1": "Cancelled",
          "-2": "Failed",
          "-3": "Refunded"
        };
        const mappedStatus = statusMap[body.status_code] || "Failed";
        
        if (!payment) {
          payment = new Payment({
            orderId: order._id,
            customerId: order.customerId || null,
            stripeSessionId: paymentId || "N/A",
            amount: order.totalCost,
            currency: (body.payhere_currency || "lkr").toLowerCase(),
            paymentMethod: "PayHere",
            paymentStatus: mappedStatus,
            gatewayResponse: body
          });
        } else {
          payment.paymentStatus = mappedStatus;
          payment.gatewayResponse = body;
        }
        await payment.save();

        if (mappedStatus === "Failed" || mappedStatus === "Cancelled") {
          order.paymentStatus = "Failed";
          if (!order.timeline) order.timeline = [];
          order.timeline.push({
            status: "Cancelled",
            note: `PayHere payment failed or cancelled with status code: ${body.status_code}. Message: ${body.status_message}`,
            timestamp: new Date()
          });
          await order.save();
        }
      }
      return { status: "processed", statusCode };
    }
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
  async verifyAndFulfillPayment(sessionId, orderId, rawSessionData = null, paymentMethod = "Stripe") {
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

    // 1. Verify Payment Record and resolve gateway
    let payment = await Payment.findOne({ orderId: order._id });
    const resolvedPaymentMethod = payment ? payment.paymentMethod : paymentMethod;

    // Attempt retrieval from Stripe if raw session data not provided and not a mock session
    if (resolvedPaymentMethod === "Stripe" && !rawSessionData && sessionId && !sessionId.startsWith("mock_stripe_session_")) {
      const stripeStrategy = new StripeGatewayStrategy();
      try {
        rawSessionData = await stripeStrategy.retrieveSession(sessionId);
      } catch (err) {
        console.warn("Could not retrieve session directly from Stripe:", err.message);
      }
    }

    const paymentCurrency = (rawSessionData?.payhere_currency || rawSessionData?.currency || "lkr").toLowerCase();
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId || null,
        stripeSessionId: sessionId || "N/A",
        amount: order.totalCost,
        currency: paymentCurrency,
        paymentMethod: resolvedPaymentMethod,
        paymentStatus: "Paid"
      });
    }

    payment.paymentMethod = resolvedPaymentMethod;
    if (resolvedPaymentMethod === "PayHere") {
      payment.stripeSessionId = sessionId || payment.stripeSessionId || "payhere_success";
      payment.stripePaymentIntentId = rawSessionData?.payment_id || sessionId || payment.stripePaymentIntentId || "payhere_success";
    } else if (resolvedPaymentMethod === "PaymentAccount" || resolvedPaymentMethod === "Card") {
      payment.stripeSessionId = sessionId || payment.stripeSessionId || `acct_session_${order._id}`;
      payment.stripePaymentIntentId = rawSessionData?.paymentIntentId || sessionId || payment.stripePaymentIntentId || `acct_intent_${order._id}`;
    } else {
      payment.stripeSessionId = sessionId || payment.stripeSessionId;
      if (rawSessionData?.payment_intent) {
        payment.stripePaymentIntentId = typeof rawSessionData.payment_intent === "string"
          ? rawSessionData.payment_intent
          : rawSessionData.payment_intent.id;
      }
    }
    payment.paymentStatus = "Paid";
    payment.paidAt = payment.paidAt || new Date();
    payment.gatewayResponse = rawSessionData || payment.gatewayResponse;
    await payment.save();

    // 3. Update Order.paymentStatus = "Paid"
    order.paymentStatus = "Paid";
    order.paymentTransactionId = payment.stripePaymentIntentId || payment.stripeSessionId;

    // 4. Update Order.status / orderStatus = "Processing"
    const isFirstTimeConfirmation = order.orderStatus === "Pending Payment";
    order.orderStatus = "Processing"; // Processing & Confirmed in production pipeline

    // Note: Inventory check and deduction is handled when the manager assigns the order to an employee.

    // 5. Create Production Workflow
    if (isFirstTimeConfirmation) {
      await this.createProductionWorkflow(order, resolvedPaymentMethod);
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
   * Helper: Step 5 - Reduce Inventory according to specifications (t-shirt style, gsm, size, color, quantity)
   */
  async reduceInventory(order) {
    try {
      if (!order.items || order.items.length === 0) return;

      for (const item of order.items) {
        const itemSize = item.selectedSize || "M";
        const itemColor = item.selectedColor || "White";
        const itemGsm = item.gsm || item.material || "180GSM";
        const itemStyle = item.tShirtStyle || "Crew Neck";
        const qty = item.quantity || 1;

        const escapeRegex = (s) => (s || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // 1. Try 4-way match: tShirtType, gsm/material, size, color
        let invItem = await Inventory.findOne({
          tShirtType: new RegExp(`^${escapeRegex(itemStyle)}$`, "i"),
          $or: [
            { gsm: new RegExp(`^${escapeRegex(itemGsm)}$`, "i") },
            { material: new RegExp(`^${escapeRegex(itemGsm)}$`, "i") }
          ],
          size: new RegExp(`^${escapeRegex(itemSize)}$`, "i"),
          color: new RegExp(`^${escapeRegex(itemColor)}$`, "i")
        });

        // 2. Try 3-way match: gsm/material, size, color
        if (!invItem) {
          invItem = await Inventory.findOne({
            $or: [
              { gsm: new RegExp(`^${escapeRegex(itemGsm)}$`, "i") },
              { material: new RegExp(`^${escapeRegex(itemGsm)}$`, "i") }
            ],
            size: new RegExp(`^${escapeRegex(itemSize)}$`, "i"),
            color: new RegExp(`^${escapeRegex(itemColor)}$`, "i")
          });
        }

        // 3. Try 2-way match: size, color
        if (!invItem) {
          invItem = await Inventory.findOne({
            size: new RegExp(`^${escapeRegex(itemSize)}$`, "i"),
            color: new RegExp(`^${escapeRegex(itemColor)}$`, "i")
          });
        }

        // 4. Fallback match by size
        if (!invItem) {
          invItem = await Inventory.findOne({
            size: new RegExp(`^${escapeRegex(itemSize)}$`, "i")
          });
        }

        if (invItem) {
          invItem.quantity = Math.max(0, (invItem.quantity || 0) - qty);
          await invItem.save();
          console.log(`Inventory reduced for ${itemStyle} (${itemGsm}, ${itemSize}, ${itemColor}): reduced ${qty}, remaining ${invItem.quantity}`);
        }
      }
    } catch (err) {
      console.error("Error reducing inventory for payment fulfillment:", err.message);
    }
  }

  /**
   * Helper: Step 6 - Create Production Workflow Timeline
   */
  async createProductionWorkflow(order, paymentMethod = "Stripe") {
    try {
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: "Processing",
        note: `${paymentMethod} payment verified successfully. Order confirmed and dispatched to 3D printing production workflow.`,
        timestamp: new Date()
      });
      await order.save();
    } catch (err) {
      console.error("Error creating production workflow entry:", err.message);
    }
  }

  /**
   * Process custom payment account checkout immediately
   */
  async processAccountPayment(orderId, accountDetails) {
    const order = await Order.findById(orderId).populate("customerId");
    if (!order) {
      throw new Error("Order not found");
    }

    const sessionId = `acct_session_${order._id}_${Date.now()}`;
    const paymentIntentId = `acct_intent_${order._id}_${Date.now()}`;

    // Create or update Payment record
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId?._id || null,
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: order.totalCost,
        currency: "lkr",
        paymentMethod: "PaymentAccount",
        paymentStatus: "Pending",
        gatewayResponse: { accountDetails }
      });
    } else {
      payment.stripeSessionId = sessionId;
      payment.stripePaymentIntentId = paymentIntentId;
      payment.paymentMethod = "PaymentAccount";
      payment.paymentStatus = "Pending";
      payment.gatewayResponse = { accountDetails };
    }
    await payment.save();

    // Now fulfill the payment using our verifyAndFulfillPayment helper
    const rawSessionData = {
      currency: "lkr",
      paymentIntentId,
      accountDetails,
      processedAt: new Date()
    };

    return await this.verifyAndFulfillPayment(sessionId, order._id, rawSessionData, "PaymentAccount");
  }

  /**
   * Process custom credit/debit card payment simulating gateway responses
   */
  async processCardPayment(orderId, cardDetails) {
    const order = await Order.findById(orderId).populate("customerId");
    if (!order) {
      throw new Error("Order not found");
    }

    const cleanCardNo = (cardDetails.cardNumber || "").replace(/\s/g, "");

    // Insufficient Funds Check
    const insufficientFundsCards = ["4024007194349121", "5459051433777487", "370787711978928"];
    if (insufficientFundsCards.includes(cleanCardNo)) {
      throw new Error("Payment failed: Insufficient Funds");
    }

    // Limit Exceeded Check
    const limitExceededCards = ["4929119799365646", "5491182243178283", "340701811823469"];
    if (limitExceededCards.includes(cleanCardNo)) {
      throw new Error("Payment failed: Limit Exceeded");
    }

    // Do Not Honor Check
    const doNotHonorCards = ["4929768900837248", "5388172137367973", "374664175202812"];
    if (doNotHonorCards.includes(cleanCardNo)) {
      throw new Error("Payment failed: Do Not Honor");
    }

    // Network Error Check
    const networkErrorCards = ["4024007120869333", "5237980565185003", "373433500205887"];
    if (networkErrorCards.includes(cleanCardNo)) {
      throw new Error("Payment failed: Network Error");
    }

    // Process payment as successful
    const sessionId = `card_session_${order._id}_${Date.now()}`;
    const paymentIntentId = `card_intent_${order._id}_${Date.now()}`;

    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        customerId: order.customerId?._id || null,
        stripeSessionId: sessionId,
        stripePaymentIntentId: paymentIntentId,
        amount: order.totalCost,
        currency: "lkr",
        paymentMethod: "Card",
        paymentStatus: "Pending",
        gatewayResponse: { cardholderName: cardDetails.cardholderName, cardBrand: cardDetails.brand || "Card" }
      });
    } else {
      payment.stripeSessionId = sessionId;
      payment.stripePaymentIntentId = paymentIntentId;
      payment.paymentMethod = "Card";
      payment.paymentStatus = "Pending";
      payment.gatewayResponse = { cardholderName: cardDetails.cardholderName, cardBrand: cardDetails.brand || "Card" };
    }
    await payment.save();

    const rawSessionData = {
      currency: "lkr",
      paymentIntentId,
      cardholderName: cardDetails.cardholderName,
      processedAt: new Date()
    };

    return await this.verifyAndFulfillPayment(sessionId, order._id, rawSessionData, "Card");
  }

  /**
   * Fetch payment record details by Payment ID
   */
  async getPaymentById(paymentId) {
    return await Payment.findById(paymentId).populate("orderId customerId");
  }
}

module.exports = new PaymentService();
