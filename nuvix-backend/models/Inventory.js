const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      required: true,
      default: "Plain T-Shirt"
    },
    // Attributes specific to Plain T-shirts
    tShirtType: {
      type: String
    },
    color: String,
    size: {
      type: String
    },
    material: {
      type: String
    },
    gsm: {
      type: String
    },
    // Stock levels
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
    minThreshold: {
      type: Number,
      required: true,
      default: 10 // Threshold at which alerts are fired
    },
    lastRestocked: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Inventory", InventorySchema);
