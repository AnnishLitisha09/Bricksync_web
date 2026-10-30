const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createVehicleFuel,
  getAllVehicleFuels,
  getVehicleFuelById,
  verifyFuel,
  searchByVehicleNumber,
  searchByBunkId,
  getFuelsByDateRange,
  deleteVehicleFuel,
} = require("../controllers/vehicleFuelController");

// 🔐 Protect all routes
router.use(authMiddleware);

// CRUD
router.post("/", role(1, 2), createVehicleFuel);
router.get("/", role(1, 2), getAllVehicleFuels);       // supports pagination ?page=1
router.delete("/:id", role(1), deleteVehicleFuel);  // Strictly Admin only

// 🔹 SEARCH ROUTES
router.get("/search/by-vehicle-number", role(1, 2), searchByVehicleNumber);
router.get("/search/by-bunk-id", role(1, 2), searchByBunkId);
router.get("/search/by-date-range", role(1, 2), getFuelsByDateRange);

// Dynamic routes
router.get("/:id", role(1, 2), getVehicleFuelById);
router.patch("/:id/verify", role(1), verifyFuel); // Admin verify

module.exports = router;
