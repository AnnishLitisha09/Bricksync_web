const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const { createDriver } = require("../controllers/authController");

router.post(
  "/create-driver",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "aadhar", maxCount: 1 },
    { name: "drivingLicence", maxCount: 1 },
    { name: "drivingLicenceBack", maxCount: 1 },
  ]),
  createDriver
);

module.exports = router;
