const Notification = require("../models/Notification");

/**
 * Creates a system notification in the database.
 * 
 * @param {Object} params
 * @param {string} [params.recipientId] - Specific user ID to receive notification. Null for role-wide.
 * @param {string} [params.recipientRole] - Role to receive notification ("Admin", "Manager", "Employee", "Customer").
 * @param {string} params.title - Title of the notification.
 * @param {string} params.message - Descriptive text of the notification.
 * @param {string} params.type - Enum value ("Order Update", "Payment Success", "Low Stock", "New Print Task").
 */
const createNotification = async ({ recipientId, recipientRole, title, message, type }) => {
  try {
    await Notification.create({
      recipientId: recipientId || null,
      recipientRole,
      title,
      message,
      type
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

module.exports = { createNotification };
