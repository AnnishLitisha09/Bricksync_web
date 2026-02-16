const nodemailer = require("nodemailer");

// Transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Send Mail Function
// Now supports BOTH text + html
exports.sendMail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"Aswath Hollow Bricks" <${process.env.EMAIL_USER}>`,
      to,
      subject,

      // Plain fallback (for old email clients)
      text: "Please view this email in an HTML supported client.",

      // ✅ THIS FIXES YOUR ISSUE
      html: htmlContent,
    });

  } catch (err) {
    console.error("❌ Mail Error:", err.message);
  }
};
