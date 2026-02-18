const db = require("../models");
const { sequelize, VehicleService, Vehicle, ServiceShop } = db;
const { Op } = require("sequelize");

/* =========================================================
   CREATE VEHICLE SERVICE
========================================================= */
exports.createVehicleService = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { serviceShopId, amount } = req.body;

    const service = await VehicleService.create(req.body, { transaction });

    const shop = await ServiceShop.findByPk(serviceShopId, { transaction });

    if (!shop) {
      await transaction.rollback();
      return res.status(404).json({ message: "Service shop not found" });
    }

    await shop.update(
      { amount: shop.amount + amount },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Vehicle service added and shop amount updated",
      data: service,
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================
   ⭐ GET SERVICES BY SHOP ID
========================================================= */
exports.getServicesByShopId = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { startDate, endDate } = req.query;

    let whereClause = {
      serviceShopId: req.params.serviceShopId,
    };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await VehicleService.findAndCountAll({
      where: whereClause,
      include: [
        { model: Vehicle, as: "vehicle" },
        { model: ServiceShop, as: "serviceShop" },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    res.json({
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================
   DELETE VEHICLE SERVICE
========================================================= */
exports.deleteVehicleService = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const service = await VehicleService.findByPk(req.params.id, {
      transaction,
    });

    if (!service) {
      await transaction.rollback();
      return res.status(404).json({ message: "Service not found" });
    }

    const shop = await ServiceShop.findByPk(service.serviceShopId, {
      transaction,
    });

    if (shop) {
      await shop.update(
        { amount: shop.amount - service.amount },
        { transaction }
      );
    }

    await service.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Vehicle service deleted and shop amount adjusted",
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================
   EXISTING FUNCTIONS (UNCHANGED)
========================================================= */

exports.getServicesByVehicleId = async (req, res) => {
  try {
    const services = await VehicleService.findAll({
      where: { vehicleId: req.params.vehicleId },
      order: [["date", "DESC"]],
    });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleWithServices = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id, {
      include: [{ model: VehicleService, as: "services" }],
    });

    if (!vehicle)
      return res.status(404).json({ message: "Vehicle not found" });

    res.json(vehicle);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllVehicleServices = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { vehicleNumber, startDate, endDate } = req.query;

    let whereClause = {};

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    let vehicleInclude = {
      model: Vehicle,
      as: "vehicle",
    };

    if (vehicleNumber) {
      vehicleInclude.where = {
        vehicleNumber: {
          [Op.like]: `%${vehicleNumber}%`,
        },
      };
    }

    const { count, rows } = await VehicleService.findAndCountAll({
      where: whereClause,
      include: [
        vehicleInclude,
        { model: ServiceShop, as: "serviceShop" },
      ],
      order: [["date", "DESC"]],
      limit,
      offset,
    });

    res.json({
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
