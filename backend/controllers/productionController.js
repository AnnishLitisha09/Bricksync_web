const { ProductionLog, ProductionEmployee, ProductStock, Office, Product, User, sequelize } = require("../models");

const { Op } = require("sequelize");

/* 🔹 Create Production Log */
exports.createProduction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { office_id, product_id, unit_produced, cement_used, production_date, employee_ids } = req.body;

        const log = await ProductionLog.create(
            { office_id, product_id, unit_produced, cement_used, production_date },
            { transaction: t }
        );

        if (employee_ids && employee_ids.length > 0) {
            const empData = employee_ids.map((id) => ({
                production_id: log.production_id,
                employee_id: id,
            }));
            await ProductionEmployee.bulkCreate(empData, { transaction: t });
        }

        // Update Stock automatically
        const [stock, created] = await ProductStock.findOrCreate({
            where: { office_id, product_id },
            defaults: { quantity: unit_produced },
            transaction: t,
        });

        if (!created) {
            stock.quantity = parseFloat(stock.quantity) + parseFloat(unit_produced);
            await stock.save({ transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: "Production logged and stock updated", log });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Get Production History */
exports.getProductionHistory = async (req, res) => {
    try {
        const history = await ProductionLog.findAll({
            where: { is_deleted: false },
            include: [
                { model: Office, as: "office" },
                { model: Product, as: "product" },
                {
                    model: ProductionEmployee,
                    as: "employees",
                    include: [{ model: User, as: "employee", attributes: ['name'] }],
                },

            ],
            order: [["production_date", "DESC"]],
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* 🔹 Get Production by ID */
exports.getProductionById = async (req, res) => {
    try {
        const log = await ProductionLog.findOne({
            where: { production_id: req.params.id, is_deleted: false },
            include: [
                { model: Office, as: "office" },
                { model: Product, as: "product" },
                { model: ProductionEmployee, as: "employees" },
            ],
        });
        if (!log) return res.status(404).json({ message: "Production log not found" });
        res.json(log);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Update Production Log */
exports.updateProduction = async (req, res) => {
    try {
        const [updated] = await ProductionLog.update(req.body, {
            where: { production_id: req.params.id, is_deleted: false },
        });
        if (!updated) return res.status(404).json({ message: "Production log not found" });
        res.json({ message: "Production log updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Soft Delete Production Log */
exports.deleteProduction = async (req, res) => {
    try {
        const [updated] = await ProductionLog.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { production_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Production log not found" });
        res.json({ message: "Production log soft deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Restore Production Log */
exports.restoreProduction = async (req, res) => {
    try {
        const [updated] = await ProductionLog.update(
            { is_deleted: false, deleted_at: null },
            { where: { production_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Production log not found" });
        res.json({ message: "Production log restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Today's Production Stats (Dashboard) */
exports.getTodayProduction = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const totalProduced = await ProductionLog.sum("unit_produced", {
            where: {
                production_date: today,
                is_deleted: false,
            },
        });
        res.json({ today_production: totalProduced || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
