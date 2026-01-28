const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createVehicleService,
  getServicesByVehicleId,
  getVehicleWithServices,
  getAllVehicleServices, // new
} = require("../controllers/vehicleServiceController");

/**
 * 🔐 Protect all routes with JWT
 */
router.use(authMiddleware);

// Add service to vehicle
router.post("/", createVehicleService);

// Get all services of a vehicle
router.get("/vehicle/:vehicleId", getServicesByVehicleId);

// Get vehicle + services
router.get("/vehicle-with-services/:id", getVehicleWithServices);

// 🔹 New: Get all vehicle services
router.get("/", getAllVehicleServices);

module.exports = router;
