const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  getProfile,
  updateProfileImage,
  updateAadharImage,
  updateDrivingLicenceImage,
  updateDrivingLicenceBack,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

router.get("/profile", verifyToken, getProfile);

// Profile Image
router.put(
  "/profile/image",
  verifyToken,
  upload.single("image"),
  updateProfileImage
);

// Aadhar Upload
router.put(
  "/profile/aadhar",
  verifyToken,
  upload.single("aadhar"),
  updateAadharImage
);

// Driving Licence Front Upload
router.put(
  "/profile/driving-licence",
  verifyToken,
  upload.single("drivingLicence"),
  updateDrivingLicenceImage
);

// Driving Licence Back Upload + Validity Date
router.put(
  "/profile/driving-licence/back",
  verifyToken,
  upload.single("drivingLicenceBack"),
  updateDrivingLicenceBack
);

// All Users
router.get("/", verifyToken, getAllUsers);

// Soft Delete
router.delete("/:userid", verifyToken, deleteUser);

module.exports = router;
