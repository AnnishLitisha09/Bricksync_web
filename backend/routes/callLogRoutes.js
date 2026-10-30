"use strict";

const express = require("express");
const router = express.Router();
const callLogController = require("../controllers/callLogController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1) - Protected Customer Call Records
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.get("/today", callLogController.getTodayCallLogs);
router.get("/next-calls", callLogController.getLogsByNextCallDate);
router.put("/toggle-status/:id", callLogController.toggleCallStatus);

router.get("/", callLogController.getAllCallLogs);
router.post("/", callLogController.createCallLog);
router.put("/:id", callLogController.updateCallLog);
router.delete("/:id", callLogController.deleteCallLog);

module.exports = router;
