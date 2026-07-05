const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  clearAllNotifications
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.post("/clear", clearAllNotifications);

module.exports = router;
