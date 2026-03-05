const express = require("express");
const router = express.Router();
const gprsController = require("../controllers/gprsController");

router.post("/sync", gprsController.syncGprsData);
router.get("/summary", gprsController.getGprsSummary);
router.post("/assign", gprsController.assignDriver);

module.exports = router;
