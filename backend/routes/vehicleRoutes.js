const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  toggleVehicleStatus,
} = require("../controllers/vehicleController");

// ✅ Multer fields
const vehicleUpload = upload.fields([
  { name: "vehicleImage", maxCount: 1 },
  { name: "rcImage", maxCount: 1 },
  { name: "insuranceImage", maxCount: 1 },
  { name: "pollutionImage", maxCount: 1 },
  { name: "speedImage", maxCount: 1 },
]);

router.post("/", vehicleUpload, createVehicle);
router.put("/:id", vehicleUpload, updateVehicle);

router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);
router.delete("/:id", deleteVehicle);
router.patch("/:id/toggle-status", toggleVehicleStatus);

module.exports = router;
