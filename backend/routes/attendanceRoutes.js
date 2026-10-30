"use strict";

const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendanceController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

// Attendance marking strictly restricted to Admin (marked by admin only)
router.post("/save", role(1), ctrl.saveAttendance);

// Attendance summaries
router.get("/weekly", role(1, 2), ctrl.getWeeklyAttendance);
router.get("/monthly-count", role(1, 2), ctrl.getMonthlyPresentCount);
router.get("/yearly-count", role(1, 2), ctrl.getYearlyPresentCount);
router.get("/today", role(1, 2), ctrl.getTodayAttendance);

module.exports = router;
