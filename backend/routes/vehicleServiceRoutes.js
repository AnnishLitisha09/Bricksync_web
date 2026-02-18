const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createVehicleService,
  getServicesByVehicleId,
  getVehicleWithServices,
  getAllVehicleServices,
} = require("../controllers/vehicleServiceController");

/* Protect all routes */
router.use(authMiddleware);

/* Create */
router.post("/", createVehicleService);

/* Vehicle specific */
router.get("/vehicle/:vehicleId", getServicesByVehicleId);

/* Vehicle + services */
router.get("/vehicle-with-services/:id", getVehicleWithServices);

/* ⭐ Pagination + Search + Date Filter */
router.get("/", getAllVehicleServices);

module.exports = router;
