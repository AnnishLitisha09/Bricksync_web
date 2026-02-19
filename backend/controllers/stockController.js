const { ProductStock, Product, Office, ProductionLog, sequelize } = require("../models");
const { Op } = require("sequelize");

/* 🔹 Get All Stock */
exports.getAllStock = async (req, res) => {
    try {
        const { office_id } = req.query;
        const where = { is_deleted: false };
        if (office_id) where.office_id = office_id;

        const stock = await ProductStock.findAll({
            where,
            include: [
                { model: Product, as: "product" },
                { model: Office, as: "office" },
            ],
        });
        res.json(stock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Manual Update Stock */
exports.manualUpdateStock = async (req, res) => {
    try {
        const { product_id, office_id, quantity } = req.body;
        const [stock, created] = await ProductStock.findOrCreate({
            where: { product_id, office_id },
            defaults: { quantity },
        });

        if (!created) {
            stock.quantity = quantity; // Manual override
            await stock.save();
        }

        res.json({ message: "Stock updated", stock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Update Stock by ID */
exports.updateStockById = async (req, res) => {
    try {
        const { quantity } = req.body;
        const stock = await ProductStock.findByPk(req.params.id);

        if (!stock) {
            return res.status(404).json({ message: "Stock record not found" });
        }

        stock.quantity = quantity;
        await stock.save();

        res.json({ message: "Stock quantity updated", stock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Soft Delete Stock Record */
exports.deleteStock = async (req, res) => {
    try {
        const [updated] = await ProductStock.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { stock_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Stock record not found" });
        res.json({ message: "Stock record soft deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Restore Stock Record */
exports.restoreStock = async (req, res) => {
    try {
        const [updated] = await ProductStock.update(
            { is_deleted: false, deleted_at: null },
            { where: { stock_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Stock record not found" });
        res.json({ message: "Stock record restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Low Stock Stats (Dashboard) */
exports.getLowStock = async (req, res) => {
    try {
        const threshold = req.query.threshold || 100;
        const lowStock = await ProductStock.findAll({
            where: {
                is_deleted: false,
                quantity: { [Op.lt]: threshold },
            },
            include: [
                { model: Product, as: "product" },
                { model: Office, as: "office" },
            ],
        });
        res.json(lowStock);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Cement Usage Stats (Dashboard) */
exports.getCementUsage = async (req, res) => {
    try {
        const totalUsage = await ProductionLog.sum("cement_used", {
            where: { is_deleted: false },
        });
        res.json({ total_cement_used: totalUsage || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
