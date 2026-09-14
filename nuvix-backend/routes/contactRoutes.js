const express = require("express");
const router = express.Router();
const {
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
} = require("../controllers/contactController");

// Public route to submit an inquiry
router.post("/", submitContactMessage);

// Manager / Admin routes to fetch & manage inquiries
router.get("/inquiries", getContactMessages);
router.patch("/inquiries/:id/status", updateContactMessageStatus);
router.delete("/inquiries/:id", deleteContactMessage);

module.exports = router;
