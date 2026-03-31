const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createVehicleService,
  getServicesByVehicleId,
  getVehicleWithServices,
  getAllVehicleServices,
  deleteVehicleService,
  getServicesByShopId,
  updateVehicleService, // ⭐ added
} = require("../controllers/vehicleServiceController");

/* Protect all routes */
router.use(authMiddleware);

/* Create */
router.post("/", createVehicleService);

/* Vehicle specific */
router.get("/vehicle/:vehicleId", getServicesByVehicleId);

/* ⭐ Shop specific */
router.get("/shop/:serviceShopId", getServicesByShopId);

/* Vehicle + services */
router.get("/vehicle-with-services/:id", getVehicleWithServices);

/* Pagination + Search + Date Filter */
router.get("/", getAllVehicleServices);

/* Update */
router.put("/:id", updateVehicleService);

/* Delete */
router.delete("/:id", deleteVehicleService);

module.exports = router;
