const mongoose = require("mongoose");

const TShirtStyleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: "Crew Neck"
    },
    price: {
      type: Number,
      default: 0
    },
    gsms: [
      {
        type: String
      }
    ],
    gsmPrices: [
      {
        gsm: { type: String, required: true },
        price: { type: Number, required: true }
      }
    ],
    colors: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("TShirtStyle", TShirtStyleSchema);
