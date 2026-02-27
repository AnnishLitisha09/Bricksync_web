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
  getDriversOnly,
  getAllUsers,
  deleteUser,
  adminUpdateUser,
  updateProfile, // ✅ NEW
} = require("../controllers/userController");


/* ================= PROFILE ================= */

router.get("/profile", verifyToken, getProfile);
router.put("/profile/update", verifyToken, updateProfile); // ✅ NEW


// Get only drivers
router.get("/drivers", verifyToken, getDriversOnly);


/* ================= SELF UPLOADS ================= */

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


/* ================= ADMIN ================= */

// Get All Users
router.get("/", verifyToken, getAllUsers);

// ⭐ Admin Update User
router.put(
  "/admin/update/:userid",
  verifyToken,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "aadhar", maxCount: 1 },
    { name: "drivingLicence", maxCount: 1 },
    { name: "drivingLicenceBack", maxCount: 1 },
  ]),
  adminUpdateUser
);

// Soft Delete
router.delete("/:userid", verifyToken, deleteUser);


module.exports = router;
