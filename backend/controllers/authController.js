const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const sendEmail = require("../utils/sendEmail");
const { Op } = require("sequelize");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, amount } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      amount,
    });

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userid: user.userid, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login success", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // RAW token (sent to email)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // HASHED token (stored in DB)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const emailHtml = `
    <div style="background:#f4f5f7;padding:30px;font-family:Arial,sans-serif;">
      <div style="max-width:500px;margin:auto;background:#ffffff;border-radius:6px;overflow:hidden;">
        
        <!-- Header -->
        <div style="background:#0079bf;padding:15px;text-align:center;">
          <h2 style="color:#ffffff;margin:0;">Aswath Hollow Bricks</h2>
        </div>

        <!-- Body -->
        <div style="padding:25px;color:#172b4d;">
          <p style="font-size:16px;">Hello <b>${user.name}</b>,</p>

          <p style="font-size:14px;">
            We heard you need a password reset. Click the button below and
            you'll be redirected to a secure page where you can set a new password.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${resetLink}"
              style="
                background:#61bd4f;
                color:#ffffff;
                padding:12px 22px;
                text-decoration:none;
                font-size:15px;
                border-radius:4px;
                display:inline-block;
              ">
              Reset Password
            </a>
          </div>

          <p style="font-size:13px;color:#5e6c84;">
            If you didn’t request a password reset, you can safely ignore this email.
          </p>

          <p style="font-size:12px;color:#a5adba;">
            This link will expire in 15 minutes.
          </p>

          <hr style="border:none;border-top:1px solid #e1e4e8;margin:20px 0;" />

          <p style="font-size:12px;color:#a5adba;">
            If the button doesn’t work, copy and paste this link into your browser:
            <br />
            <a href="${resetLink}" style="color:#0052cc;">Click Me</a>
          </p>
        </div>
      </div>
    </div>
    `;

    await sendEmail(user.email, "Reset Your Password", emailHtml);

    res.json({ message: "Password reset link sent to email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // HASH incoming token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          [Op.gt]: Date.now(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
