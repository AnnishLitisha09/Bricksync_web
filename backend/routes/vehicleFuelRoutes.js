const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
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
router.post("/", createVehicleFuel);
router.get("/", getAllVehicleFuels);       // supports pagination ?page=1
router.delete("/:id", deleteVehicleFuel);  // DELETE fuel

// 🔹 SEARCH ROUTES (static routes MUST come before dynamic :id)
router.get("/search/by-vehicle-number", searchByVehicleNumber); // ?vehicleNumber=XYZ
router.get("/search/by-bunk-id", searchByBunkId);               // ?bunkId=2
router.get("/search/by-date-range", getFuelsByDateRange);       // ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD

// Dynamic routes
router.get("/:id", getVehicleFuelById);
router.patch("/:id/verify", verifyFuel);

module.exports = router;
