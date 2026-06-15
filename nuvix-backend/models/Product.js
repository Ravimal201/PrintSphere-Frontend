const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    basePrice: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    sizes: [
      {
        type: String,
        enum: ["S", "M", "L", "XL", "XXL"]
      }
    ],
    colors: [String],
    images: [String],
    status: {
      type: String,
      enum: ["Draft", "Active", "Archived"],
      default: "Active"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isApproved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", ProductSchema);
