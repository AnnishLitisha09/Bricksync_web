const { ServiceShop } = require("../models");

/* ================= CREATE ================= */
exports.createServiceShop = async (req, res) => {
  try {
    const shop = await ServiceShop.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Service shop created successfully",
      data: shop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL ================= */
exports.getAllServiceShops = async (req, res) => {
  try {
    const data = await ServiceShop.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET BY ID ================= */
exports.getServiceShopById = async (req, res) => {
  try {
    const shop = await ServiceShop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Service shop not found",
      });
    }

    return res.json(shop);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE ================= */
exports.updateServiceShop = async (req, res) => {
  try {
    const shop = await ServiceShop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Service shop not found",
      });
    }

    await shop.update(req.body);

    return res.json({
      success: true,
      message: "Service shop updated successfully",
      data: shop,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE ================= */
exports.deleteServiceShop = async (req, res) => {
  try {
    const shop = await ServiceShop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Service shop not found",
      });
    }

    await shop.destroy();

    return res.json({
      success: true,
      message: "Service shop deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
