const {
  sequelize,
  WalletTransaction,
  User,
  BankTable,
} = require("../models");

// ======================================================
// ✅ CREATE TRANSACTION
// ======================================================
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

  const t = await sequelize.transaction();

  try {
    if (!userid || !amount || !type)
      throw new Error("Missing required fields");

    const user = await User.findOne({ where: { userid }, transaction: t });
    if (!user) throw new Error("User not found");

    const bank = await BankTable.findOne({ where: { name: bankName }, transaction: t });
    if (!bank) throw new Error("Bank not found");

    const amt = Number(amount);

    // ==================================================
    // 🔥 BALANCE FLOW LOGIC
    // ==================================================

    // ⭐⭐⭐ ADVANCE CATEGORY — USER WALLET + BANK ⭐⭐⭐
    if (category === "advance") {
      if (type === "received") {
        // Add to user's wallet
        await User.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        // Also add to bank amount
        await BankTable.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      } else if (type === "sent") {
        // Deduct from user's wallet
        if (user.amount < amt) throw new Error("Insufficient wallet balance");

        await User.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        // Deduct from bank as well
        if (bank.amount < amt) throw new Error("Insufficient bank balance");
        await BankTable.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      }
    }

    // ⭐⭐⭐ NORMAL FLOW — USER + BANK ⭐⭐⭐
    else {
      if (type === "received") {
        await User.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      } else if (type === "sent") {
        if (user.amount < amt) throw new Error("Insufficient wallet balance");

        await User.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      }
    }

    // ==================================================
    // CREATE RECORD
    // ==================================================
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
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Transaction completed",
      data: record,
    });

  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ✅ GET USER TRANSACTIONS
// ======================================================
exports.getTransactions = async (req, res) => {
  try {
    const { userid } = req.query;

    const data = await WalletTransaction.findAll({
      where: { userid },
      include: [{ model: BankTable, as: "bank" }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ✅ DELETE + REVERT BALANCE
// ======================================================
exports.deleteTransaction = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const tx = await WalletTransaction.findByPk(req.params.id, { transaction: t });
    if (!tx) throw new Error("Transaction not found");

    const user = await User.findOne({ where: { userid: tx.userid }, transaction: t });
    const bank = await BankTable.findByPk(tx.bank_id, { transaction: t });
    const amt = tx.amount;

    // ⭐⭐⭐ REVERT ADVANCE — USER WALLET + BANK ⭐⭐⭐
    if (tx.category === "advance") {
      if (tx.type === "received") {
        await User.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      } else if (tx.type === "sent") {
        await User.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      }
    }

    // ⭐⭐⭐ REVERT NORMAL — USER + BANK ⭐⭐⭐
    else {
      if (tx.type === "received") {
        await User.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      } else if (tx.type === "sent") {
        await User.update(
          { amount: sequelize.literal(`amount + ${amt}`) },
          { where: { userid: user.userid }, transaction: t }
        );
        await BankTable.update(
          { amount: sequelize.literal(`amount - ${amt}`) },
          { where: { id: bank.id }, transaction: t }
        );
      }
    }

    await tx.destroy({ transaction: t });
    await t.commit();

    res.json({ success: true, message: "Deleted & balances restored" });

  } catch (err) {
    await t.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};
