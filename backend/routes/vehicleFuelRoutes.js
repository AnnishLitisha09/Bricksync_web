const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createVehicleFuel,
  getAllVehicleFuels,
  getVehicleFuelById,
  verifyFuel,
} = require("../controllers/vehicleFuelController");

// 🔐 Protect all routes
router.use(authMiddleware);

// CRUD
router.post("/", createVehicleFuel);
router.get("/", getAllVehicleFuels);       // supports ?page=1, ?page=2 etc.
router.get("/:id", getVehicleFuelById);
router.patch("/:id/verify", verifyFuel);

module.exports = router;
