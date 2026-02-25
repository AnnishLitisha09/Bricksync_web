const express = require("express");
const router = express.Router();
const callLogController = require("../controllers/callLogController");

router.post("/", callLogController.createCallLog);
router.get("/next-calls", callLogController.getLogsByNextCallDate);
router.get("/", callLogController.getAllCallLogs);
router.put("/:id", callLogController.updateCallLog);
router.delete("/:id", callLogController.deleteCallLog);

module.exports = router;
