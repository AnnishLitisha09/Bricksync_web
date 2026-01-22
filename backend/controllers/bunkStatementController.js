const db = require("../models");
const BunkStatement = db.BunkStatement;
const Vehicle = db.Vehicle;
const Bunk = db.Bunk;
const VehicleFuel = db.VehicleFuel;

// Add fuel/payment
exports.createBunkStatement = async (req, res) => {
  try {
    const { bunkId, vehicleId, fuelId, date, amount, isFueled } = req.body;

    const statement = await BunkStatement.create({
      bunkId,
      vehicleId: vehicleId || null,
      fuelId: fuelId || null,
      date,
      amount,
      isFueled,
    });

    const bunk = await Bunk.findByPk(bunkId);
    if (bunk) {
      bunk.amount += isFueled ? amount : -amount;
      await bunk.save();
    }

    res.status(201).json(statement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Direct pay to bunk
exports.payToBunk = async (req, res) => {
  try {
    const { bunkId, amount, date } = req.body;

    if (!bunkId || !amount || !date)
      return res.status(400).json({ message: "bunkId, amount, and date are required" });

    const bunk = await Bunk.findByPk(bunkId);
    if (!bunk) return res.status(404).json({ message: "Bunk not found" });
    if (bunk.amount < amount) return res.status(400).json({ message: "Insufficient bunk amount" });

    bunk.amount -= amount;
    await bunk.save();

    const statement = await BunkStatement.create({
      bunkId,
      vehicleId: null,
      fuelId: null,
      date,
      amount,
      isFueled: 0,
    });

    res.status(201).json(statement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all
exports.getAllBunkStatements = async (req, res) => {
  try {
    const statements = await BunkStatement.findAll({
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "bunk", attributes: ["id", "bunkName"] },
        { model: VehicleFuel, as: "fuel", attributes: ["fuelId", "volume", "amount"] },
      ],
      order: [["date", "DESC"]],
    });
    res.json(statements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Filter
exports.filterBunkStatements = async (req, res) => {
  try {
    const { vehicleId, bunkId } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (bunkId) where.bunkId = bunkId;

    const statements = await BunkStatement.findAll({
      where,
      include: [
        { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleName", "vehicleNumber"] },
        { model: Bunk, as: "bunk", attributes: ["id", "bunkName"] },
        { model: VehicleFuel, as: "fuel", attributes: ["fuelId", "volume", "amount"] },
      ],
      order: [["date", "DESC"]],
    });
    res.json(statements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
