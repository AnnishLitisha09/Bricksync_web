const express = require("express");
const router = express.Router();
const salaryController = require("../controllers/salaryController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1) - Protected Payroll & Financial Wages
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.get("/weekly", salaryController.getWeeklySalaryOverview);
router.get("/weekly-overview", salaryController.getWeeklySalaryOverview);
router.get("/settings", salaryController.getGlobalSettings);
router.put("/settings/:key", salaryController.updateGlobalSetting);
router.post("/global-rate", salaryController.updateGlobalDriverRate);
router.put("/global-rate", salaryController.updateGlobalDriverRate);

module.exports = router;
