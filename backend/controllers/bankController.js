const { BankTable } = require("../models");

/* ===================== CREATE ===================== */
exports.createBank = async (req, res) => {
  try {
    const {
      name,
      accountNumber,
      holderName,
      amount,
      bankTransfer,
      phonepe,
      gpay,
    } = req.body;

    // Validation
    if (!name || !accountNumber || !holderName) {
      return res.status(400).json({
        success: false,
        message: "name, accountNumber and holderName are required",
      });
    }

    const bank = await BankTable.create({
      name,
      accountNumber,
      holderName,
      amount: Number(amount) || 0,
      bankTransfer: !!bankTransfer,
      phonepe: !!phonepe,
      gpay: !!gpay,
    });

    return res.status(201).json({
      success: true,
      message: "Bank record created successfully",
      data: bank,
    });
  } catch (error) {
    console.error("CREATE BANK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create bank record",
    });
  }
};

/* ===================== GET ALL ===================== */
exports.getAllBanks = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const search = req.query.search || "";
    const { Op } = require("sequelize");

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { holderName: { [Op.like]: `%${search}%` } },
        { accountNumber: { [Op.like]: `%${search}%` } },
      ];
    }

    if (page) {
      const { count, rows } = await BankTable.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset: (page - 1) * limit,
      });
      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    }

    const banks = await BankTable.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    console.error("GET ALL BANKS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bank records",
    });
  }
};

/* ===================== GET BY ID ===================== */
exports.getBankById = async (req, res) => {
  try {
    const bank = await BankTable.findByPk(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank record not found",
      });
    }

    return res.json({
      success: true,
      data: bank,
    });
  } catch (error) {
    console.error("GET BANK BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bank record",
    });
  }
};

/* ===================== UPDATE ===================== */
exports.updateBank = async (req, res) => {
  try {
    const bank = await BankTable.findByPk(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank record not found",
      });
    }

    await bank.update(req.body);

    return res.json({
      success: true,
      message: "Bank record updated successfully",
      data: bank,
    });
  } catch (error) {
    console.error("UPDATE BANK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update bank record",
    });
  }
};

/* ===================== DELETE ===================== */
exports.deleteBank = async (req, res) => {
  try {
    const bank = await BankTable.findByPk(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank record not found",
      });
    }

    await bank.destroy();

    return res.json({
      success: true,
      message: "Bank record deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BANK ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete bank record",
    });
  }
};
