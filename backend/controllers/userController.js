const { User } = require("../models");

/* 🔹 Get Profile */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        userid: req.user.userid,
        isDeleted: false,
      },
      attributes: [
        "userid",
        "name",
        "email",
        "phoneNumber",
        "amount",
        "imageUrl",
        "aadharUrl",
        "drivingLicenceUrl",
        "drivingLicenceBackUrl",
        "drivingLicenceValidity",
        "userRole",
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Update Profile Image */
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const imageUrl = `/images/${req.file.filename}`;

    await User.update(
      { imageUrl },
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({ message: "Profile image updated", imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Update Aadhaar */
exports.updateAadharImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No Aadhar image uploaded" });

    const aadharUrl = `/images/${req.file.filename}`;

    await User.update(
      { aadharUrl },
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({ message: "Aadhar card uploaded successfully", aadharUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Update Driving Licence Front */
exports.updateDrivingLicenceImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No Driving Licence image uploaded" });

    const drivingLicenceUrl = `/images/${req.file.filename}`;

    await User.update(
      { drivingLicenceUrl },
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({ message: "Driving licence uploaded successfully", drivingLicenceUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Update Driving Licence Back + Validity Date */
exports.updateDrivingLicenceBack = async (req, res) => {
  try {
    if (!req.file && !req.body.validityDate)
      return res.status(400).json({ message: "No data provided" });

    const updates = {};
    if (req.file) updates.drivingLicenceBackUrl = `/images/${req.file.filename}`;
    if (req.body.validityDate) updates.drivingLicenceValidity = req.body.validityDate;

    await User.update(
      updates,
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({
      message: "Driving licence back uploaded successfully",
      ...updates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Get All Users */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isDeleted: false },
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* 🔹 Soft Delete User */
exports.deleteUser = async (req, res) => {
  try {
    await User.update(
      { isDeleted: true },
      { where: { userid: req.params.userid } }
    );
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
