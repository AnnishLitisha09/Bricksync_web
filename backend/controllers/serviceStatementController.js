const db = require("../models");
const sequelize = db.sequelize;

const { BankTable, ServiceShop, ServiceStatement } = db;


/**
 * CREATE
 */
exports.createServiceStatement = async (req, res) => {
  const { service_shop_id, bank_id, amount, payment_mode, description } = req.body;

  const transaction = await sequelize.transaction();

  try {

    const bank = await BankTable.findByPk(bank_id, { transaction });
    if (!bank) throw new Error("Bank not found");

    if (bank.amount < amount)
      throw new Error("Insufficient bank balance");

    const shop = await ServiceShop.findByPk(service_shop_id, { transaction });
    if (!shop) throw new Error("Service shop not found");

    if (shop.amount < amount)
      throw new Error("Insufficient shop balance");

    await bank.decrement("amount", { by: amount, transaction });
    await shop.decrement("amount", { by: amount, transaction });

    const record = await ServiceStatement.create(
      { service_shop_id, bank_id, amount, payment_mode, description },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({ success: true, data: record });

  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};



/**
 * GET ALL
 */
exports.getAllServiceStatements = async (req, res) => {
  const data = await ServiceStatement.findAll({
    include: [
      { model: BankTable, as: "bank" },
      { model: ServiceShop, as: "shop" },
    ],
    order: [["createdAt", "DESC"]],
  });

  res.json({ success: true, data });
};



/**
 * GET BY ID
 */
exports.getServiceStatementById = async (req, res) => {
  const data = await ServiceStatement.findByPk(req.params.id, {
    include: [
      { model: BankTable, as: "bank" },
      { model: ServiceShop, as: "shop" },
    ],
  });

  if (!data)
    return res.status(404).json({ success: false });

  res.json({ success: true, data });
};



/**
 * DELETE + REVERT
 */
exports.deleteServiceStatement = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const record = await ServiceStatement.findByPk(req.params.id, { transaction });
    if (!record) throw new Error("Not found");

    const bank = await BankTable.findByPk(record.bank_id, { transaction });
    const shop = await ServiceShop.findByPk(record.service_shop_id, { transaction });

    await bank.increment("amount", { by: record.amount, transaction });
    await shop.increment("amount", { by: record.amount, transaction });

    await record.destroy({ transaction });
    await transaction.commit();

    res.json({ success: true });

  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};
