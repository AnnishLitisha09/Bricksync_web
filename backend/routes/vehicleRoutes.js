const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  toggleVehicleStatus,
} = require("../controllers/vehicleController");

router.use(auth);

// Multer fields
const vehicleUpload = upload.fields([
  { name: "vehicleImage", maxCount: 1 },
  { name: "rcImage", maxCount: 1 },
  { name: "insuranceImage", maxCount: 1 },
  { name: "pollutionImage", maxCount: 1 },
  { name: "speedImage", maxCount: 1 },
]);

// Admin-only vehicle modifications
router.post("/", role(1), vehicleUpload, createVehicle);
router.put("/:id", role(1), vehicleUpload, updateVehicle);
router.delete("/:id", role(1), deleteVehicle);
router.patch("/:id/toggle-status", role(1), toggleVehicleStatus);

// Vehicle lookup (Admin, Driver)
router.get("/", role(1, 2), getAllVehicles);
router.get("/:id", role(1, 2), getVehicleById);

module.exports = router;
