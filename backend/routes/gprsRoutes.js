"use strict";

const express = require("express");
const router = express.Router();
const gprsController = require("../controllers/gprsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware(1, 2));

router.post("/sync", roleMiddleware(1), gprsController.syncGprsData);
router.get("/summary", gprsController.getGprsSummary);
router.post("/assign", roleMiddleware(1), gprsController.assignDriver);
router.get("/live/:vehicleNumber", gprsController.getVehicleLiveData);

module.exports = router;
