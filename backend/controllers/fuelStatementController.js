const { sequelize, BankTable, Bunk, FuelStatement } = require("../models");

exports.createFuelStatement = async (req, res) => {
  const { bunk_id, bank_id, amount } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const bank = await BankTable.findByPk(bank_id, { transaction });
    if (!bank) throw new Error("Bank not found");

    if (bank.amount < amount) throw new Error("Insufficient bank balance");

    const bunk = await Bunk.findByPk(bunk_id, { transaction });
    if (!bunk) throw new Error("Bunk not found");

    if (bunk.amount < amount) throw new Error("Insufficient bunk balance");

    // Deduct from bank
    await bank.update({ amount: bank.amount - amount }, { transaction });

    // Deduct from bunk
    await bunk.update({ amount: bunk.amount - amount }, { transaction });

    // Insert fuel statement
    const fuelStatement = await FuelStatement.create(
      { bunk_id, bank_id, amount },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Fuel statement created successfully",
      data: fuelStatement,
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllFuelStatements = async (req, res) => {
  try {
    const data = await FuelStatement.findAll({
      include: [
        { model: BankTable, as: "bank" },
        { model: Bunk, as: "bunk" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET ALL FUEL STATEMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fuel statement records",
    });
  }
};

exports.getFuelStatementById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await FuelStatement.findByPk(id, {
      include: [
        { model: BankTable, as: "bank" },
        { model: Bunk, as: "bunk" },
      ],
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Fuel statement not found",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET FUEL STATEMENT BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fuel statement",
    });
  }
};

exports.deleteFuelStatement = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const fuelStatement = await FuelStatement.findByPk(id, { transaction });
    if (!fuelStatement) {
      throw new Error("Fuel statement not found");
    }

    const { bank_id, bunk_id, amount } = fuelStatement;

    const bank = await BankTable.findByPk(bank_id, { transaction });
    const bunk = await Bunk.findByPk(bunk_id, { transaction });

    if (!bank || !bunk) {
      throw new Error("Associated bank or bunk not found");
    }

    // Refund amounts
    await bank.increment("amount", { by: amount, transaction });
    await bunk.increment("amount", { by: amount, transaction });

    // Delete fuel statement
    await fuelStatement.destroy({ transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Fuel statement deleted and balance reverted successfully",
    });
  } catch (error) {
    await transaction.rollback();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
