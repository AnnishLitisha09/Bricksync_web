const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html, attachments = []) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // Prevents some common SSL handshake issues
    },
    pool: true, // Reuse connections
  });

  await transporter.sendMail({
    from: `"Bricksync System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
};

module.exports = sendEmail;
