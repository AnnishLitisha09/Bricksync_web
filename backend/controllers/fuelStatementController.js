const db = require("../models");

const FuelStatement = db.FuelStatement;
const BankTable = db.BankTable;
const Bunk = db.Bunk;


/* ================= CREATE ================= */

exports.createFuelStatement = async (req, res) => {
  try {
    const { bunk_id, bank_id, amount, payment_mode, description } = req.body;

    const record = await FuelStatement.create({
      bunk_id,
      bank_id,
      amount,
      payment_mode,
      description,
    });

    res.status(201).json({
      success: true,
      data: record,
    });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ================= GET ALL ================= */

exports.getAllFuelStatements = async (req, res) => {
  try {
    const records = await FuelStatement.findAll({
      include: [
        {
          model: BankTable,
          as: "bank",
          attributes: ["id", "name"],
        },
        {
          model: Bunk,
          as: "bunk",
          attributes: ["id", "bunkName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });

  } catch (err) {
    console.error("GET ERROR:", err);   // ⭐ CRITICAL DEBUG
    res.status(500).json({
      success: false,
      message: "Failed to fetch fuel statement records",
    });
  }
};


/* ================= GET BY ID ================= */

exports.getFuelStatementById = async (req, res) => {
  try {
    const record = await FuelStatement.findByPk(req.params.id);

    if (!record)
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });

    res.json({
      success: true,
      data: record,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ================= DELETE ================= */

exports.deleteFuelStatement = async (req, res) => {
  try {
    const record = await FuelStatement.findByPk(req.params.id);

    if (!record)
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });

    await record.destroy();

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
