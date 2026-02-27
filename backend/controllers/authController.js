const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User } = require("../models");
const sendEmail = require("../utils/sendEmail");
const { Op } = require("sequelize");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, phoneNumber, password, amount, userRole } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      amount,
      userRole: userRole || 3,
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
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const emailHtml = `...same template unchanged...`;

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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* ================= CREATE DRIVER (UPDATED) ================= */
exports.createDriver = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      amount,
      drivingLicenceValidity,
      staffRole,            // ✅ NEW
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      amount,
      userRole: 2, // DRIVER

      staffRole: staffRole || null,  // ✅ NEW

      imageUrl: req.files?.image?.[0]?.filename
        ? `/images/${req.files.image[0].filename}`
        : null,

      aadharUrl: req.files?.aadhar?.[0]?.filename
        ? `/images/${req.files.aadhar[0].filename}`
        : null,

      drivingLicenceUrl: req.files?.drivingLicence?.[0]?.filename
        ? `/images/${req.files.drivingLicence[0].filename}`
        : null,

      drivingLicenceBackUrl: req.files?.drivingLicenceBack?.[0]?.filename
        ? `/images/${req.files.drivingLicenceBack[0].filename}`
        : null,

      drivingLicenceValidity,
    });

    res.status(201).json({
      message: "Driver created",
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
