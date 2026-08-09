const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    stripeSessionId: {
      type: String,
      index: true
    },
    stripePaymentIntentId: {
      type: String
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "lkr",
      lowercase: true
    },
    paymentMethod: {
      type: String,
      enum: ["Stripe", "PayHere", "Card", "CashOnDelivery", "PaymentAccount"],
      default: "Stripe"
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Cancelled", "Refunded"],
      default: "Pending"
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", PaymentSchema);
