"use strict";

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Protected Business Analytics (Admin Only)
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.get("/today-summary", analyticsController.getTodaySummary);
router.get("/bi-overview", analyticsController.getBiOverview);
router.get("/bom-depletion", analyticsController.getBomDepletion);
router.get("/credit-check/:customerId", analyticsController.getCreditCheck);
router.get("/kiosk-live", analyticsController.getKioskLive);

module.exports = router;
