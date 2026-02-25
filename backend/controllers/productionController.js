const { ProductionLog, ProductionEmployee, ProductStock, Office, Product, User, sequelize } = require("../models");

const { Op } = require("sequelize");

/* 🔹 Create Production Log */
exports.createProduction = async (req, res) => {
    console.log("Creating production log with body:", req.body);
    const t = await sequelize.transaction();
    try {
        const { office_id, product_id, unit_produced, cement_used, cement_product_id, production_date, employee_ids } = req.body;
        console.log("Extracted fields:", { office_id, product_id, unit_produced, cement_used, cement_product_id, production_date });

        // 🔹 PRE-VALIDATION: Check Cement Stock Availability
        if (cement_product_id && cement_used) {
            const cementStock = await ProductStock.findOne({
                where: {
                    office_id: Number(office_id),
                    product_id: Number(cement_product_id),
                    is_deleted: false
                },
                transaction: t
            });

            const availableQty = cementStock ? parseFloat(cementStock.quantity) : 0;
            const requiredQty = parseFloat(cement_used);

            if (requiredQty > availableQty) {
                await t.rollback();
                return res.status(400).json({
                    error: `Insufficient cement stock. Available: ${availableQty}, Required: ${requiredQty}`
                });
            }
        }

        const log = await ProductionLog.create(
            {
                office_id: Number(office_id),
                product_id: Number(product_id),
                unit_produced: parseFloat(unit_produced),
                cement_used: parseFloat(cement_used || 0),
                cement_product_id: cement_product_id ? Number(cement_product_id) : null,
                production_date
            },
            { transaction: t }
        );

        if (employee_ids && employee_ids.length > 0) {
            const empData = employee_ids.map((id) => ({
                production_id: log.production_id,
                employee_id: Number(id),
            }));
            await ProductionEmployee.bulkCreate(empData, { transaction: t });
        }

        // Update Stock automatically for the produced item
        const [stock, created] = await ProductStock.findOrCreate({
            where: { office_id: Number(office_id), product_id: Number(product_id) },
            defaults: { quantity: 0 },
            transaction: t,
        });

        stock.quantity = parseFloat(stock.quantity) + parseFloat(unit_produced);
        await stock.save({ transaction: t });

        // Deduct Cement Stock if cement_used and cement_product_id are provided
        if (cement_product_id && cement_used) {
            const cementId = Number(cement_product_id);
            const cementQty = parseFloat(cement_used);

            if (!isNaN(cementId) && cementId > 0 && !isNaN(cementQty) && cementQty > 0) {
                console.log("Cement usage detected and validated:", { cementQty, cementId, office_id });
                const [cementStock, cementCreated] = await ProductStock.findOrCreate({
                    where: { office_id: Number(office_id), product_id: cementId },
                    defaults: { quantity: 0 },
                    transaction: t,
                });

                if (!cementCreated) {
                    console.log("Existing cement stock found, quantity was:", cementStock.quantity);
                }

                cementStock.quantity = parseFloat(cementStock.quantity) - cementQty;
                console.log("New cement quantity will be:", cementStock.quantity);
                await cementStock.save({ transaction: t });
            } else {
                console.log("Cement validation failed:", { cementId, cementQty });
            }
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
                { model: Product, as: "cementProduct" }, // Added cement product details
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
                { model: Product, as: "cementProduct" }, // Added cement product details
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

/* 🔹 Today's Production Logs for Stock Page */
exports.getTodayProduction = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const logs = await ProductionLog.findAll({
            where: {
                production_date: today,
                is_deleted: false,
            },
            include: [
                { model: Office, as: "office" },
                { model: Product, as: "product" },
                { model: Product, as: "cementProduct" },
                {
                    model: ProductionEmployee,
                    as: "employees",
                    include: [{ model: User, as: "employee", attributes: ['name'] }],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
