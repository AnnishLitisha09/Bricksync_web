const { sendMail } = require("../middleware/mailer");

// Simple in-memory store for OTPs (In a production app, use Redis or DB with TTL)
const otpStore = new Map();

exports.sendOTP = async (req, res) => {
    try {
        const adminEmail = "bricksync001@gmail.com";
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

        // Store OTP with expiry (5 minutes)
        otpStore.set(adminEmail, {
            code: otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #edeff2; padding-bottom: 10px;">Security Verification</h2>
        <p style="color: #475569; font-size: 16px;">A request was made to view sensitive bank balances on Bricksync.</p>
        <p style="color: #475569; font-size: 16px;">Your verification code is:</p>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: 800; color: #1e293b; letter-spacing: 12px;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 20px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #edeff2; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">© 2026 Bricksync Enterprise Security System</p>
      </div>
    `;

        await sendMail(adminEmail, "Critical Access: Bank Balance Verification Code", htmlContent);

        return res.json({
            success: true,
            message: "OTP sent successfully to registered admin email"
        });
    } catch (error) {
        console.error("SEND OTP ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP"
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { code } = req.body;
        const adminEmail = "bricksync001@gmail.com";
        const storedData = otpStore.get(adminEmail);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: "No OTP found or it has expired"
            });
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(adminEmail);
            return res.status(400).json({
                success: false,
                message: "OTP has expired"
            });
        }

        if (storedData.code !== code) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code"
            });
        }

        // Success - clear OTP
        otpStore.delete(adminEmail);

        return res.json({
            success: true,
            message: "Verification successful"
        });
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during verification"
        });
    }
};
