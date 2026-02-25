const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");

router.get("/version", backupController.getAppVersion);
router.get("/status", backupController.getBackupStatus);
router.post("/trigger", backupController.triggerBackup);

module.exports = router;
