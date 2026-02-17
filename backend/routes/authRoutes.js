const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  createDriver, // ✅ added
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // multer config


/* ================= AUTH ================= */

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


/* ================= DRIVER ================= */
/*
Supports multipart upload:
image
aadhar
drivingLicence
drivingLicenceBack
*/
router.post(
  "/create-driver",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "aadhar", maxCount: 1 },
    { name: "drivingLicence", maxCount: 1 },
    { name: "drivingLicenceBack", maxCount: 1 },
  ]),
  createDriver
);

module.exports = router;
