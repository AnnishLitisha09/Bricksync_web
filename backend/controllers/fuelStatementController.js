const db = require("../models");

const FuelStatement = db.FuelStatement;
const BankTable = db.BankTable;
const Bunk = db.Bunk;
const sequelize = db.sequelize;


/* ================= CREATE ================= */

exports.createFuelStatement = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { bunk_id, bank_id, amount, payment_mode, description } = req.body;

    // 🔹 Get Bank
    const bank = await BankTable.findByPk(bank_id, { transaction: t });

    if (!bank) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Bank not found",
      });
    }

    // 🔹 Check Funds
    if (bank.amount < amount) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient bank amount",
      });
    }

    // 🔹 Deduct
    bank.amount -= amount;
    await bank.save({ transaction: t });

    // 🔹 Create Statement
    const record = await FuelStatement.create(
      {
        bunk_id,
        bank_id,
        amount,
        payment_mode,
        description,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      data: record,
    });

  } catch (err) {
    await t.rollback();
    console.error(err);

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
          attributes: ["id", "name", "amount"],
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
    console.error("GET ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch fuel statement records",
    });
  }
};


/* ================= GET BY ID ================= */

exports.getFuelStatementById = async (req, res) => {
  try {
    const record = await FuelStatement.findByPk(req.params.id, {
      include: [
        { model: BankTable, as: "bank" },
        { model: Bunk, as: "bunk" },
      ],
    });

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
/* Refund money back */

exports.deleteFuelStatement = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const record = await FuelStatement.findByPk(req.params.id, {
      transaction: t,
    });

    if (!record) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // 🔹 Refund
    const bank = await BankTable.findByPk(record.bank_id, {
      transaction: t,
    });

    if (bank) {
      bank.amount += record.amount;
      await bank.save({ transaction: t });
    }

    await record.destroy({ transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Deleted & amount refunded",
    });

  } catch (err) {
    await t.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
