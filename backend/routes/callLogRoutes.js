const express = require("express");
const router = express.Router();
const callLogController = require("../controllers/callLogController");

router.post("/", callLogController.createCallLog);
router.get("/today", callLogController.getTodayCallLogs);
router.get("/next-calls", callLogController.getLogsByNextCallDate);
router.get("/", callLogController.getAllCallLogs);
router.put("/:id", callLogController.updateCallLog);
router.patch("/:id/status", callLogController.toggleCallStatus);
router.delete("/:id", callLogController.deleteCallLog);

module.exports = router;
