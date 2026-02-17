const {
  sequelize,
  WalletTransaction,
  User,
  BankTable,
} = require("../models");


// ✅ CREATE
exports.createTransaction = async (req, res) => {
  const {
    userid,
    bankName,
    amount,
    type,
    category,
    paymentType,
    description,
    date,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    if (!userid || !amount)
      throw new Error("Missing required fields");

    const user = await User.findByPk(userid, { transaction });
    if (!user) throw new Error("User not found");

    const bank = await BankTable.findOne({
      where: { name: bankName },
      transaction,
    });

    if (!bank) throw new Error("Bank not found");

    const amt = Number(amount);

    // ========= BALANCE FLOW =========

    if (type === "received") {
      // Salary / Advance Added

      await user.increment("amount", {
        by: amt,
        transaction,
      });

      await bank.decrement("amount", {
        by: amt,
        transaction,
      });

    } else {
      // Advance Deduction

      if (user.amount < amt)
        throw new Error("Insufficient user balance");

      await user.decrement("amount", {
        by: amt,
        transaction,
      });

      await bank.increment("amount", {
        by: amt,
        transaction,
      });
    }

    const record = await WalletTransaction.create(
      {
        userid,
        bank_id: bank.id,
        amount: amt,
        type,
        category,
        paymentType,
        description,
        date,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Transaction completed",
      data: record,
    });

  } catch (err) {
    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ GET USER TRANSACTIONS
exports.getTransactions = async (req, res) => {
  try {
    const { userid } = req.query;

    const data = await WalletTransaction.findAll({
      where: { userid },
      include: [{ model: BankTable, as: "bank" }],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data,
    });

  } catch {
    res.status(500).json({ success: false });
  }
};



// ✅ DELETE + REVERT
exports.deleteTransaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const tx = await WalletTransaction.findByPk(req.params.id, {
      transaction: t,
    });

    if (!tx) throw new Error("Transaction not found");

    const user = await User.findByPk(tx.userid, { transaction: t });
    const bank = await BankTable.findByPk(tx.bank_id, { transaction: t });

    const amt = tx.amount;

    if (tx.type === "received") {
      await user.decrement("amount", { by: amt, transaction: t });
      await bank.increment("amount", { by: amt, transaction: t });
    } else {
      await user.increment("amount", { by: amt, transaction: t });
      await bank.decrement("amount", { by: amt, transaction: t });
    }

    await tx.destroy({ transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: "Deleted & balances restored",
    });

  } catch (e) {
    await t.rollback();
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
