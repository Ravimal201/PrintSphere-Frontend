const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Employee", "Customer"],
      default: "Customer"
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    savedPaymentMethod: {
      methodType: { type: String, enum: ["card", "payhere", "cod"], default: "card" },
      cardholderName: String,
      cardLast4: String,
      expiryDate: String,
      brand: String
    },
    savedDesigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomizedDesign"
      }
    ]
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", UserSchema);
