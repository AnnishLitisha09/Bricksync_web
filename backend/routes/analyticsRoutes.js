const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/today-summary", analyticsController.getTodaySummary);

module.exports = router;
