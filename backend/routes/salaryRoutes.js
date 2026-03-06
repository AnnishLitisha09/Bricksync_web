const express = require("express");
const router = express.Router();
const salaryController = require("../controllers/salaryController");

router.get("/weekly-overview", salaryController.getWeeklySalaryOverview);
router.get("/settings", salaryController.getGlobalSettings);
router.put("/settings/:key", salaryController.updateGlobalSetting);

module.exports = router;
