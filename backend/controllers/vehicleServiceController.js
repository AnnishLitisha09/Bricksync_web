// controllers/vehicleServiceController.js

// Import db models
const db = require("../models");
const { sequelize, VehicleService, Vehicle, ServiceShop } = db; // include all models you need

// Create vehicle service
exports.createVehicleService = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { serviceShopId, amount } = req.body;

    // Create vehicle service
    const service = await VehicleService.create(req.body, { transaction });

    // Update service shop amount
    const shop = await ServiceShop.findByPk(serviceShopId, { transaction });

    if (!shop) {
      await transaction.rollback();
      return res.status(404).json({ message: "Service shop not found" });
    }

    await shop.update({ amount: shop.amount + amount }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Vehicle service added and shop amount updated",
      data: service,
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// Get all services for a vehicle
exports.getServicesByVehicleId = async (req, res) => {
  try {
    const services = await VehicleService.findAll({
      where: { vehicleId: req.params.vehicleId },
      order: [["date", "DESC"]],
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get vehicle with its services
exports.getVehicleWithServices = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: VehicleService, as: "services" }],
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
