const nodemailer = require("nodemailer");

/**
 * Send an email notification when a contact form or inquiry is submitted.
 *
 * @param {Object} data
 * @param {string} data.name - Sender name
 * @param {string} data.email - Sender email
 * @param {string} data.subject - Inquiry subject
 * @param {string} data.message - Message content
 * @param {string} data.source - Source form page
 */
const sendContactInquiryEmail = async ({ name, email, subject, message, source }) => {
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL || "nuvixapparelbiz@gmail.com";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log(`[EmailService] Received new inquiry from "${name}" <${email}> via ${source || "Contact Page"}`);

  if (!user || !pass) {
    console.warn(
      "[EmailService] EMAIL_USER or EMAIL_PASS not configured in .env. Email dispatch skipped, but inquiry is securely stored in MongoDB."
    );
    return {
      sent: false,
      reason: "Email credentials not configured in backend .env",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,
        pass: pass,
      },
    });

    const mailOptions = {
      from: `"PrintSphere Inquiries" <${user}>`,
      to: receiverEmail,
      replyTo: email,
      subject: `[PrintSphere Inquiry] ${subject || "New Customer Message"} - from ${name}`,
      text: `You received a new inquiry from the PrintSphere website:\n\n` +
            `Source: ${source || "Contact Us Page"}\n` +
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Subject: ${subject || "General Inquiry"}\n\n` +
            `Message:\n${message}\n\n` +
            `---\n` +
            `Reply directly to this email to respond to ${name}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #1e1b4b; margin: 0; font-size: 20px;">✉️ New Website Inquiry</h2>
            <p style="color: #64748b; font-size: 12px; margin-top: 4px;">Received via PrintSphere (${source || "Contact Us"})</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; width: 120px; font-weight: bold;">Sender Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: bold;">Sender Email:</td>
              <td style="padding: 8px 0; color: #4f46e5; font-size: 14px;"><a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: bold;">Source:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 13px;"><span style="background-color: #eef2ff; color: #4338ca; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${source || "Contact Us"}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: bold;">Subject:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600;">${subject || "General Inquiry"}</td>
            </tr>
          </table>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Message Details:</p>
            <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-line;">${message}</p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject || 'PrintSphere Inquiry')}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: bold; text-decoration: none;">Reply to ${name}</a>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] Email sent successfully:", info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailService] Error sending email:", error.message);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendContactInquiryEmail,
};
