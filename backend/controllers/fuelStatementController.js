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

    const bank = await BankTable.findByPk(bank_id, { transaction: t });
    if (!bank) throw new Error("Bank not found");

    const bunk = await Bunk.findByPk(bunk_id, { transaction: t });
    if (!bunk) throw new Error("Bunk not found");

    if (bank.amount < amount) throw new Error("Insufficient bank amount");
    if (bunk.amount < amount) throw new Error("Insufficient bunk amount");

    // Deduct amounts
    bank.amount -= amount;
    await bank.save({ transaction: t });

    bunk.amount -= amount;
    await bunk.save({ transaction: t });

    // Create Fuel Statement
    const record = await FuelStatement.create(
      { bunk_id, bank_id, amount, payment_mode, description },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({ success: true, data: record });

  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
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
          attributes: ["id", "bunkName", "amount"],
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
    const record = await FuelStatement.findByPk(req.params.id, { transaction: t });
    if (!record) throw new Error("Record not found");

    const bank = await BankTable.findByPk(record.bank_id, { transaction: t });
    if (bank) { bank.amount += record.amount; await bank.save({ transaction: t }); }

    const bunk = await Bunk.findByPk(record.bunk_id, { transaction: t });
    if (bunk) { bunk.amount += record.amount; await bunk.save({ transaction: t }); }

    await record.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: "Deleted & refunded to bank and bunk" });

  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
};