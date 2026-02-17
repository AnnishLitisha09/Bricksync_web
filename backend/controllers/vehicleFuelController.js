const db = require("../models");
const VehicleFuel = db.VehicleFuel;
const Vehicle = db.Vehicle;
const Bunk = db.Bunk;
const BunkStatement = db.BunkStatement;

/* CREATE */
exports.createVehicleFuel = async (req, res) => {
  try {
    const { vehicleId, bunkId, volume, amount, date, kilometer } = req.body;

    // 1️⃣ Create fuel record
    const fuel = await VehicleFuel.create({
      vehicleId,
      bunkId,
      volume,
      amount,
      date,
      kilometer,
    });

    // 2️⃣ Update Vehicle Kilometer
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (vehicle) {
      vehicle.kilometer = kilometer;
      await vehicle.save();
    }

    // 3️⃣ Update Bunk Amount
    const bunk = await Bunk.findByPk(bunkId);
    if (bunk) {
      bunk.amount += amount;
      await bunk.save();
    }

    // 4️⃣ Add entry to BunkStatement automatically
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
    // Get page from query, default to 1
    let page = parseInt(req.query.page) || 1;
    const limit = 10; // 10 records per page
    const offset = (page - 1) * limit;

    const { count, rows } = await VehicleFuel.findAndCountAll({
      include: [
        {
          model: Vehicle,
          as: "vehicle",
          attributes: ["id", "vehicleName", "vehicleNumber"],
        },
        {
          model: Bunk,
          as: "fuelBunk",
          attributes: ["id", "bunkName"],
        },
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
    const fuel = await VehicleFuel.findByPk(req.params.id);
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
