const db = require("../models");
const VehicleFuel = db.VehicleFuel;
const Vehicle = db.Vehicle;
const Bunk = db.Bunk;
const BunkStatement = db.BunkStatement;
const { Op } = require("sequelize");

/* CREATE */
exports.createVehicleFuel = async (req, res) => {
  try {
    const { vehicleId, bunkId, volume, amount, date, kilometer } = req.body;

    const fuel = await VehicleFuel.create({ vehicleId, bunkId, volume, amount, date, kilometer });

    const vehicle = await Vehicle.findByPk(vehicleId);
    if (vehicle) {
      vehicle.kilometer = kilometer;
      await vehicle.save();
    }

    const bunk = await Bunk.findByPk(bunkId);
    if (bunk) {
      bunk.amount += amount;
      await bunk.save();
    }

    await BunkStatement.create({
      bunkId,
      vehicleId,
      fuelId: fuel.fuelId,
      date,
      amount,
      isFueled: 1,
    });

    res.status(201).json(fuel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL WITH PAGINATION */
exports.getAllVehicleFuels = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await VehicleFuel.findAndCountAll({
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "fuelBunk", attributes: ["id", "bunkName"] },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    res.json({
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      fuels: rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* GET FUEL BY ID */
exports.getVehicleFuelById = async (req, res) => {
  try {
    const fuel = await VehicleFuel.findByPk(req.params.id, {
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "fuelBunk", attributes: ["id", "bunkName"] },
      ],
    });
    if (!fuel) return res.status(404).json({ message: "Fuel record not found" });
    res.json(fuel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* VERIFY FUEL */
exports.verifyFuel = async (req, res) => {
  try {
    const fuel = await VehicleFuel.findByPk(req.params.id);
    if (!fuel) return res.status(404).json({ message: "Fuel record not found" });

    fuel.isVerified = !fuel.isVerified;
    await fuel.save();

    res.json({
      message: `Fuel record ${fuel.isVerified ? "verified" : "unverified"}`,
      fuel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* SEARCH BY VEHICLE NUMBER */
exports.searchByVehicleNumber = async (req, res) => {
  try {
    const { vehicleNumber } = req.query;
    if (!vehicleNumber) return res.status(400).json({ message: "vehicleNumber query is required" });

    const fuels = await VehicleFuel.findAll({
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          where: { vehicleNumber: { [Op.like]: `%${vehicleNumber}%` } },
          attributes: ["id", "vehicleName", "vehicleNumber"],
        },
        { model: Bunk, as: "fuelBunk", attributes: ["id", "bunkName"] },
      ],
      order: [["date", "DESC"]],
    });

    res.json(fuels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* SEARCH BY BUNK ID */
exports.searchByBunkId = async (req, res) => {
  try {
    const { bunkId } = req.query;
    if (!bunkId) return res.status(400).json({ message: "bunkId query is required" });

    const fuels = await VehicleFuel.findAll({
      where: { bunkId },
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "fuelBunk", attributes: ["id", "bunkName"] },
      ],
      order: [["date", "DESC"]],
    });

    res.json(fuels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* GET FUELS BY DATE RANGE */
exports.getFuelsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({ message: "startDate and endDate query parameters are required" });

    const fuels = await VehicleFuel.findAll({
      where: {
        date: { [Op.between]: [new Date(startDate), new Date(endDate)] },
      },
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "fuelBunk", attributes: ["id", "bunkName"] },
      ],
      order: [["date", "DESC"]],
    });

    res.json(fuels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DELETE FUEL */
exports.deleteVehicleFuel = async (req, res) => {
  try {
    const fuel = await VehicleFuel.findByPk(req.params.id);
    if (!fuel) return res.status(404).json({ message: "Fuel record not found" });

    await fuel.destroy();
    res.json({ message: "Fuel record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
