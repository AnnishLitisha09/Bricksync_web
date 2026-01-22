const db = require("../models");
const Vehicle = db.Vehicle;

/**
 * Map uploaded files to DB fields
 * Keeps old images if not replaced
 */
const mapImages = (files, existingVehicle = {}) => {
  return {
    vehicleImage: files?.vehicleImage
      ? "/images/" + files.vehicleImage[0].filename
      : existingVehicle.vehicleImage,

    rcImage: files?.rcImage
      ? "/images/" + files.rcImage[0].filename
      : existingVehicle.rcImage,

    insuranceImage: files?.insuranceImage
      ? "/images/" + files.insuranceImage[0].filename
      : existingVehicle.insuranceImage,

    pollutionImage: files?.pollutionImage
      ? "/images/" + files.pollutionImage[0].filename
      : existingVehicle.pollutionImage,

    speedImage: files?.speedImage
      ? "/images/" + files.speedImage[0].filename
      : existingVehicle.speedImage,
  };
};

/* =========================
   CREATE VEHICLE
========================= */
exports.createVehicle = async (req, res) => {
  try {
    const {
      vehicleName,
      vehicleNumber,
      insurance,
      pollution,
      rcDate,
      kilometer,
    } = req.body || {};

    const vehicleData = {
      vehicleName,
      vehicleNumber,
      insurance: insurance ? new Date(insurance) : null,
      pollution: pollution ? new Date(pollution) : null,
      rcDate: rcDate ? new Date(rcDate) : null,
      kilometer: Number(kilometer) || 0,
      ...mapImages(req.files),
    };

    const vehicle = await Vehicle.create(vehicleData);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("CREATE VEHICLE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ALL VEHICLES
========================= */
exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(vehicles);
  } catch (error) {
    console.error("GET VEHICLES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET VEHICLE BY ID
========================= */
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    // ✅ Ensure vehicleImage is included
    res.json(vehicle);
  } catch (error) {
    console.error("GET VEHICLE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE VEHICLE
========================= */
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      vehicleName,
      vehicleNumber,
      insurance,
      pollution,
      rcDate,
      kilometer,
      isActive,
    } = req.body || {};

    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // ✅ Use mapImages to handle vehicleImage + other images
    const images = mapImages(req.files, vehicle);

    await vehicle.update({
      vehicleName: vehicleName ?? vehicle.vehicleName,
      vehicleNumber: vehicleNumber ?? vehicle.vehicleNumber,
      insurance: insurance ? new Date(insurance) : vehicle.insurance,
      pollution: pollution ? new Date(pollution) : vehicle.pollution,
      rcDate: rcDate ? new Date(rcDate) : vehicle.rcDate,
      kilometer: kilometer !== undefined ? Number(kilometer) : vehicle.kilometer,
      isActive: isActive !== undefined ? isActive : vehicle.isActive,
      ...images, // ✅ This will correctly set vehicleImage
    });

    return res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    console.error("UPDATE VEHICLE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
    });
  }
};


/* =========================
   DELETE VEHICLE
========================= */
exports.deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.destroy({
      where: { id: req.params.id },
    });

    if (!deleted)
      return res.status(404).json({ message: "Vehicle not found" });

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("DELETE VEHICLE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   TOGGLE ACTIVE STATUS
========================= */
exports.toggleVehicleStatus = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();

    res.json({
      message: "Vehicle status updated",
      isActive: vehicle.isActive,
    });
  } catch (error) {
    console.error("TOGGLE STATUS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
