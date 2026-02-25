const { BankTable } = require("../models");
const { encrypt } = require("../utils/encryption");

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
      amount: encrypt(amount || 0),
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
    const banks = await BankTable.findAll({
      order: [["createdAt", "DESC"]],
    });

    const securedBanks = banks.map(bank => {
      const plain = bank.toJSON();
      return {
        ...plain,
        amount: encrypt(plain.amount) // Encrypting for network transmission
      };
    });

    return res.json({
      success: true,
      data: securedBanks,
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
