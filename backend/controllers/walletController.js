const { Op } = require("sequelize");
const {
  sequelize,
  WalletTransaction,
  User,
  BankTable,
  MaterialStatement,
  ServiceStatement,
  FuelStatement,
  MaterialSupplier,
  ServiceShop,
  Bunk,
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
// ======================================================
// ✅ GET ALL SYSTEM TRANSACTIONS (Consolidated)
// ======================================================
exports.getSystemTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, bankId, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let walletTx = [], materialTx = [], serviceTx = [], fuelTx = [];

    // Common Date Filter
    const dateQuery = {};
    const walletWhere = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      dateQuery.createdAt = { [Op.between]: [start, end] };
      walletWhere.date = { [Op.between]: [start, end] };
    }

    if (bankId) {
      dateQuery.bank_id = bankId;
      walletWhere.bank_id = bankId;
    }

    if (search) {
      const searchPattern = `%${search}%`;
      // Apply search to common dateQuery (for Material, Service, Fuel)
      dateQuery[Op.or] = [
        { description: { [Op.iLike]: searchPattern } }
      ];

      // Wallet specifically search in user name as well
      walletWhere[Op.or] = [
        { description: { [Op.iLike]: searchPattern } },
        { '$user.name$': { [Op.iLike]: searchPattern } }
      ];
    }

    try {
      walletTx = await WalletTransaction.findAll({
        where: walletWhere,
        include: [{ model: BankTable, as: "bank" }, { model: User, as: "user" }],
        order: [["createdAt", "DESC"]],
        subQuery: false, // Required for searching in included models
      });
      console.log(`✅ Wallet: ${walletTx.length}`);
    } catch (e) {
      console.error("❌ Wallet error:", e.message);
    }

    try {
      const materialWhere = { ...dateQuery };
      if (search) {
        materialWhere[Op.or] = [
          { description: { [Op.iLike]: `%${search}%` } },
          { '$supplier.shop_name$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      materialTx = await MaterialStatement.findAll({
        where: materialWhere,
        include: [{ model: BankTable, as: "bank" }, { model: MaterialSupplier, as: "supplier" }],
        order: [["createdAt", "DESC"]],
        subQuery: false,
      });
      console.log(`✅ Material: ${materialTx.length}`);
    } catch (e) { console.error("❌ Material error:", e.message); }

    try {
      const serviceWhere = { ...dateQuery };
      if (search) {
        serviceWhere[Op.or] = [
          { description: { [Op.iLike]: `%${search}%` } },
          { '$shop.shop_name$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      serviceTx = await ServiceStatement.findAll({
        where: serviceWhere,
        include: [{ model: BankTable, as: "bank" }, { model: ServiceShop, as: "shop" }],
        order: [["createdAt", "DESC"]],
        subQuery: false,
      });
      console.log(`✅ Service: ${serviceTx.length}`);
    } catch (e) { console.error("❌ Service error:", e.message); }

    try {
      const fuelWhere = { ...dateQuery };
      if (search) {
        fuelWhere[Op.or] = [
          { description: { [Op.iLike]: `%${search}%` } },
          { '$bunk.bunkName$': { [Op.iLike]: `%${search}%` } }
        ];
      }
      fuelTx = await FuelStatement.findAll({
        where: fuelWhere,
        include: [{ model: BankTable, as: "bank" }, { model: Bunk, as: "bunk" }],
        order: [["createdAt", "DESC"]],
        subQuery: false,
      });
      console.log(`✅ Fuel: ${fuelTx.length}`);
    } catch (e) { console.error("❌ Fuel error:", e.message); }

    // Normalize Wallet Transactions
    const normalizedWallet = walletTx.map((tx) => ({
      id: `w-${tx.id}`,
      name: tx.user?.name || "System",
      category: tx.category || "Wallet",
      date: tx.date || tx.createdAt,
      amount: tx.amount,
      isSent: tx.type === "sent",
      bankName: tx.bank?.name || "Cash",
      type: "WALLET",
      description: tx.description
    }));

    // Normalize Material Statements (Always Sent/Outgoing)
    const normalizedMaterial = materialTx.map((tx) => ({
      id: `m-${tx.id}`,
      name: tx.supplier?.shop_name || "Supplier",
      category: "Material",
      date: tx.createdAt,
      amount: tx.amount,
      isSent: true,
      bankName: tx.bank?.name || "Bank",
      type: "MATERIAL",
      description: tx.description
    }));

    // Normalize Service Statements (Always Sent/Outgoing)
    const normalizedService = serviceTx.map((tx) => ({
      id: `s-${tx.id}`,
      name: tx.shop?.shop_name || "Service Shop",
      category: "Service",
      date: tx.createdAt,
      amount: tx.amount,
      isSent: true,
      bankName: tx.bank?.name || "Bank",
      type: "SERVICE",
      description: tx.description
    }));

    // Normalize Fuel Statements (Always Sent/Outgoing)
    const normalizedFuel = fuelTx.map((tx) => ({
      id: `f-${tx.id}`,
      name: tx.bunk?.bunkName || "Fuel Bunk",
      category: "Fuel",
      date: tx.createdAt,
      amount: tx.amount,
      isSent: true,
      bankName: tx.bank?.name || "Bank",
      type: "FUEL",
      description: tx.description
    }));

    // Combine and Sort
    const consolidated = [
      ...normalizedWallet,
      ...normalizedMaterial,
      ...normalizedService,
      ...normalizedFuel,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Manual Pagination
    const total = consolidated.length;
    const paginatedData = consolidated.slice(offset, offset + Number(limit));

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error("GET SYSTEM TRANSACTIONS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
