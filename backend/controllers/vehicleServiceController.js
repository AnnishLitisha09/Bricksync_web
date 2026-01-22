const db = require("../models");
const VehicleService = db.VehicleService;
const Vehicle = db.Vehicle;

// Create service
exports.createVehicleService = async (req, res) => {
  try {
    const service = await VehicleService.create(req.body);
    res.status(201).json(service);
  } catch (error) {
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
      include: [
        {
          model: VehicleService,
          as: "services",
        },
      ],
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
