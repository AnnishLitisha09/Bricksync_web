const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createVehicleService,
  getServicesByVehicleId,
  getVehicleWithServices,
  getAllVehicleServices,
  deleteVehicleService,
  getServicesByShopId,
  updateVehicleService,
} = require("../controllers/vehicleServiceController");

/* Protect all routes */
router.use(authMiddleware);

/* Create (Admin only) */
router.post("/", role(1), createVehicleService);

/* Vehicle specific */
router.get("/vehicle/:vehicleId", role(1, 2), getServicesByVehicleId);

/* ⭐ Shop specific */
router.get("/shop/:serviceShopId", role(1), getServicesByShopId);

/* Vehicle + services */
router.get("/vehicle-with-services/:id", role(1, 2), getVehicleWithServices);

/* Pagination + Search + Date Filter */
router.get("/", role(1, 2), getAllVehicleServices);

/* Update (Admin only) */
router.put("/:id", role(1), updateVehicleService);

/* Delete (Admin only) */
router.delete("/:id", role(1), deleteVehicleService);

module.exports = router;
