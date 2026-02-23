const express = require("express");
const router = express.Router();
const otpController = require("../controllers/otpController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/send", authMiddleware, otpController.sendOTP);
router.post("/verify", authMiddleware, otpController.verifyOTP);

module.exports = router;
