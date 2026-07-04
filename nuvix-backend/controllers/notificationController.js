const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

const verifyUserToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const notifications = await Notification.find({
      $or: [
        { recipientId: decoded.id },
        { recipientRole: decoded.role }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied" });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Server error while updating notification" });
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/notifications/clear
exports.clearAllNotifications = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied" });
    }

    await Notification.updateMany(
      {
        $or: [
          { recipientId: decoded.id },
          { recipientRole: decoded.role }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Server error while clearing notifications" });
  }
};
