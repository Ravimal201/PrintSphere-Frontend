const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["Plain T-Shirt", "Printing Ink", "Transfer Paper"],
      required: true
    },
    // Attributes specific to Plain T-shirts
    tShirtType: {
      type: String,
      enum: ["Crew Neck", "V-Neck", "Polo"]
    },
    color: String,
    size: {
      type: String,
      enum: ["S", "M", "L", "XL", "XXL"]
    },
    material: {
      type: String,
      enum: ["Cotton", "Polyester", "Organic Cotton"]
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
