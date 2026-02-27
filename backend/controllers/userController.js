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
        "staffRole",
      ],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 ADMIN UPDATE USER (NEW) */
exports.adminUpdateUser = async (req, res) => {
  try {
    const { userid } = req.params;

    const updates = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      amount: req.body.amount,
      userRole: req.body.userRole,
      staffRole: req.body.staffRole,
      drivingLicenceValidity: req.body.drivingLicenceValidity || null,
    };

    // Handle File Uploads
    if (req.files) {
      if (req.files.image) updates.imageUrl = req.files.image[0].filename;
      if (req.files.aadhar) updates.aadharUrl = req.files.aadhar[0].filename;
      if (req.files.drivingLicence) updates.drivingLicenceUrl = req.files.drivingLicence[0].filename;
      if (req.files.drivingLicenceBack) updates.drivingLicenceBackUrl = req.files.drivingLicenceBack[0].filename;
    }

    // remove undefined fields
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [updated] = await User.update(updates, {
      where: { userid, isDeleted: false },
    });

    if (!updated)
      return res.status(404).json({ message: "User not found" });

    const user = await User.findByPk(userid, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      message: "User updated by admin",
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 UPDATE PROFILE (Self) */
exports.updateProfile = async (req, res) => {
  try {
    const userid = req.user.userid;

    const updates = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
    };

    // Remove undefined fields
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key]
    );

    const [updated] = await User.update(updates, {
      where: { userid, isDeleted: false },
    });

    if (!updated)
      return res.status(404).json({ message: "User not found" });

    const user = await User.findByPk(userid, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      message: "Profile updated successfully",
      user,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 Update Profile Image */
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });

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
    if (!req.file)
      return res.status(400).json({ message: "No Aadhar image uploaded" });

    const aadharUrl = `/images/${req.file.filename}`;

    await User.update(
      { aadharUrl },
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({ message: "Aadhar uploaded", aadharUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 Update Driving Licence Front */
exports.updateDrivingLicenceImage = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No DL image uploaded" });

    const drivingLicenceUrl = `/images/${req.file.filename}`;

    await User.update(
      { drivingLicenceUrl },
      { where: { userid: req.user.userid, isDeleted: false } }
    );

    res.json({
      message: "Driving licence uploaded",
      drivingLicenceUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 Update Driving Licence Back */
exports.updateDrivingLicenceBack = async (req, res) => {
  try {
    if (!req.file && !req.body.validityDate)
      return res.status(400).json({ message: "No data provided" });

    const updates = {};

    if (req.file)
      updates.drivingLicenceBackUrl = `/images/${req.file.filename}`;

    if (req.body.validityDate)
      updates.drivingLicenceValidity = req.body.validityDate;

    await User.update(updates, {
      where: { userid: req.user.userid, isDeleted: false },
    });

    res.json({
      message: "Updated successfully",
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


/* 🔹 Soft Delete */
exports.deleteUser = async (req, res) => {
  try {
    await User.update(
      { isDeleted: true },
      { where: { userid: req.params.userid } }
    );

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/* 🔹 Drivers Only */
exports.getDriversOnly = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      where: {
        isDeleted: false,
        userRole: 2,
      },
      attributes: { exclude: ["password"] },
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      drivers: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
