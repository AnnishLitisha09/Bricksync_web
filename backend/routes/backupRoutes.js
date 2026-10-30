"use strict";

const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1) - Protected Database Backup Operations
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.get("/version", backupController.getAppVersion);
router.get("/status", backupController.getBackupStatus);
router.post("/trigger", backupController.triggerBackup);

module.exports = router;
