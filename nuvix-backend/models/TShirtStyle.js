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
    gsms: [
      {
        type: String
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
