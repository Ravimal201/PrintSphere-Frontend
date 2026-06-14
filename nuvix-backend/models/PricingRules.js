const mongoose = require("mongoose");

const PricingRulesSchema = new mongoose.Schema(
  {
    baseRates: {
      crewNeck: { type: Number, default: 12.00 },
      vNeck: { type: Number, default: 14.00 },
      polo: { type: Number, default: 18.00 }
    },
    materialPremiums: {
      cotton: { type: Number, default: 0.00 },
      polyester: { type: Number, default: 1.50 },
      organicCotton: { type: Number, default: 3.00 }
    },
    costPerSqIn: {
      type: Number,
      default: 0.02
    },
    complexityFeePerLayer: {
      type: Number,
      default: 1.00
    },
    volumeDiscount: {
      thresholdQty: { type: Number, default: 5 },
      discountPercentage: { type: Number, default: 10 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("PricingRules", PricingRulesSchema);
