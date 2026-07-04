const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // Null for role-wide announcements
    },
    recipientRole: {
      type: String,
      enum: ["Admin", "Manager", "Employee", "Customer"]
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["Order Update", "Payment Success", "Low Stock", "New Print Task"],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
