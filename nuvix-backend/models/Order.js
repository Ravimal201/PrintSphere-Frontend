const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ["Ready-made", "Customized"],
    default: function() {
      return this.designId ? "Customized" : "Ready-made";
    }
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomizedDesign"
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedSize: {
    type: String,
    required: true
  },
  selectedColor: {
    type: String,
    required: true
  },
  tShirtStyle: {
    type: String
  },
  gsm: {
    type: String,
    default: "180GSM"
  },
  material: {
    type: String,
    default: "Standard cotton"
  },
  price: {
    type: Number,
    required: true
  }
});

const StatusTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "Pending Payment",
      "Processing",
      "Printing",
      "Completed",
      "Shipped",
      "Cancelled"
    ]
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  note: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const OrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // Null if guest user checked out
    },
    guestEmail: String, // if guest checkout
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    printCost: {
      type: Number,
      default: 0
    },
    complexityFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending"
    },
    paymentTransactionId: String,
    orderStatus: {
      type: String,
      enum: [
        "Pending Payment",
        "Processing",
        "Printing",
        "Completed",
        "Shipped",
        "Cancelled"
      ],
      default: "Pending Payment"
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // Assigned printing operator
    },
    timeline: [StatusTimelineSchema], // History of order lifecycle
    invoiceUrl: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", OrderSchema);
