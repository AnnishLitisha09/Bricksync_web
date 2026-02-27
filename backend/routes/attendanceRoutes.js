const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/attendanceController");
const auth = require("../middleware/authMiddleware");

router.use(auth);

router.post("/save", ctrl.saveAttendance);

router.get("/weekly", ctrl.getWeeklyAttendance);

router.get("/monthly-count", ctrl.getMonthlyPresentCount);

router.get("/yearly-count", ctrl.getYearlyPresentCount);

router.get("/today", ctrl.getTodayAttendance);

module.exports = router;
