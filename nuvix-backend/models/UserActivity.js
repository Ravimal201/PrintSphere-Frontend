const mongoose = require("mongoose");

const UserActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true
    },
    sessionId: {
      type: String,
      required: false,
      index: true
    },
    action: {
      type: String,
      enum: ["VIEW_PRODUCT", "SEARCH_PRODUCT", "ADD_TO_CART", "PURCHASE", "BROWSE_CATEGORY"],
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true
    },
    category: {
      type: String,
      trim: true
    },
    searchTerm: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Composite index for fast recommendation queries
UserActivitySchema.index({ userId: 1, action: 1 });
UserActivitySchema.index({ sessionId: 1, action: 1 });
UserActivitySchema.index({ productId: 1, action: 1 });

module.exports = mongoose.model("UserActivity", UserActivitySchema);
