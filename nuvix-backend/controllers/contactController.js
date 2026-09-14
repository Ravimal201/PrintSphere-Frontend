const ContactMessage = require("../models/ContactMessage");
const { sendContactInquiryEmail } = require("../services/emailService");

/**
 * Submit a new Contact / Support inquiry (Public)
 */
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message, source } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide your name, email, and message.",
      });
    }

    // Save to Database
    const newInquiry = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      subject: (subject && subject.trim()) || "General Inquiry",
      message: message.trim(),
      source: source || "Contact Us",
      status: "New",
    });

    // Trigger Email Notification asynchronously
    sendContactInquiryEmail({
      name: newInquiry.name,
      email: newInquiry.email,
      subject: newInquiry.subject,
      message: newInquiry.message,
      source: newInquiry.source,
    }).catch((err) => {
      console.error("[ContactController] Background email error:", err);
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your message has been received and our team will get back to you soon.",
      data: newInquiry,
    });
  } catch (error) {
    console.error("[ContactController] Error submitting contact message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit your message. Please try again later.",
      error: error.message,
    });
  }
};

/**
 * Get all contact messages / inquiries (For Admin & Manager)
 */
const getContactMessages = async (req, res) => {
  try {
    const { status, source, search } = req.query;
    let query = {};

    if (status && status !== "ALL") {
      query.status = status;
    }
    if (source && source !== "ALL") {
      query.source = source;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { subject: regex },
        { message: regex },
      ];
    }

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 });

    const totalCount = await ContactMessage.countDocuments();
    const newCount = await ContactMessage.countDocuments({ status: "New" });
    const resolvedCount = await ContactMessage.countDocuments({ status: "Resolved" });

    return res.json({
      success: true,
      data: messages,
      stats: {
        total: totalCount,
        new: newCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error("[ContactController] Error fetching inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
};

/**
 * Update message status (e.g. New -> In Progress -> Resolved)
 */
const updateContactMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["New", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Inquiry message not found",
      });
    }

    return res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("[ContactController] Error updating message status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update inquiry status",
      error: error.message,
    });
  }
};

/**
 * Delete a contact message
 */
const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ContactMessage.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Inquiry message not found",
      });
    }

    return res.json({
      success: true,
      message: "Inquiry message deleted successfully",
    });
  } catch (error) {
    console.error("[ContactController] Error deleting inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete inquiry",
      error: error.message,
    });
  }
};

module.exports = {
  submitContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
};
