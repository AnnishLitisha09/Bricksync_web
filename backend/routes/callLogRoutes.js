const express = require("express");
const router = express.Router();
const callLogController = require("../controllers/callLogController");

console.log("🚛 [Routes] Initializing Call Log Routes...");

// IMPORTANT: Specific routes must come before generic ones (like /:id)
router.get("/today", callLogController.getTodayCallLogs);
router.get("/next-calls", callLogController.getLogsByNextCallDate);

// Toggle status - using a unique path prefix to avoid any parameter ambiguity
router.put("/toggle-status/:id", callLogController.toggleCallStatus);

// Generic CRUD
router.get("/", callLogController.getAllCallLogs);
router.post("/", callLogController.createCallLog);
router.put("/:id", callLogController.updateCallLog);
router.delete("/:id", callLogController.deleteCallLog);

module.exports = router;
