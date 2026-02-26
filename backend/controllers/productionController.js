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

/* 🔹 Update Production Log with Stock Re-Sync */
exports.updateProduction = async (req, res) => {
    console.log(`📝 [UpdateProduction] Editing log ID: ${req.params.id}`);
    const t = await sequelize.transaction();
    try {
        const log = await ProductionLog.findOne({
            where: { production_id: req.params.id, is_deleted: false },
            transaction: t
        });

        if (!log) {
            console.warn(`⚠️ [UpdateProduction] Log not found: ${req.params.id}`);
            if (t) await t.rollback();
            return res.status(404).json({ message: "Production log not found" });
        }

        const { unit_produced, office_id, product_id, cement_used, cement_product_id } = req.body;

        // 1. Update Produced Product Stock
        if (unit_produced !== undefined || product_id !== undefined || office_id !== undefined) {
            const oldQty = parseFloat(log.unit_produced) || 0;
            const newQty = parseFloat(unit_produced !== undefined ? unit_produced : log.unit_produced) || 0;
            const oldProdId = log.product_id;
            const newProdId = product_id || log.product_id;
            const oldOffId = log.office_id;
            const newOffId = office_id || log.office_id;

            if (oldProdId === newProdId && oldOffId === newOffId) {
                // Same product, same office - just adjust by difference
                const diff = newQty - oldQty;
                if (diff !== 0) {
                    const stock = await ProductStock.findOne({
                        where: { office_id: newOffId, product_id: newProdId, is_deleted: false },
                        transaction: t
                    });
                    if (stock) {
                        stock.quantity = parseFloat(stock.quantity) + diff;
                        await stock.save({ transaction: t });
                        console.log(`🔄 [UpdateProduction] Adjusted Stock ID ${stock.stock_id}: ${diff > 0 ? '+' : ''}${diff}`);
                    }
                }
            } else {
                // Product or Office changed - Reverse old, Apply new
                // Reverse Old
                const oldStock = await ProductStock.findOne({
                    where: { office_id: oldOffId, product_id: oldProdId, is_deleted: false },
                    transaction: t
                });
                if (oldStock) {
                    oldStock.quantity = parseFloat(oldStock.quantity) - oldQty;
                    await oldStock.save({ transaction: t });
                }
                // Apply New
                const [newStock] = await ProductStock.findOrCreate({
                    where: { office_id: newOffId, product_id: newProdId, is_deleted: false },
                    defaults: { quantity: 0 },
                    transaction: t
                });
                newStock.quantity = parseFloat(newStock.quantity) + newQty;
                await newStock.save({ transaction: t });
            }
        }

        // 3. Update the Log
        await log.update(req.body, { transaction: t });

        await t.commit();
        console.log(`✅ [UpdateProduction] Log updated and stock synchronized: ${req.params.id}`);
        res.json({ message: "Production log and stock updated successfully" });
    } catch (err) {
        console.error(`❌ [UpdateProduction] Error:`, err);
        if (t) await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Soft Delete Production Log with Stock Reversal */
exports.deleteProduction = async (req, res) => {
    console.log(`🗑️ [DeleteProduction] Starting deletion for ID: ${req.params.id}`);
    const t = await sequelize.transaction();
    try {
        const log = await ProductionLog.findOne({
            where: { production_id: req.params.id, is_deleted: false },
            transaction: t
        });

        if (!log) {
            console.warn(`⚠️ [DeleteProduction] Log not found or already deleted: ${req.params.id}`);
            if (t) await t.rollback();
            return res.status(404).json({ message: "Production log not found" });
        }

        console.log(`📋 [DeleteProduction] Reversing: ${log.unit_produced} units of product ${log.product_id} from office ${log.office_id}`);

        // 1. Reverse Produced Item Stock (Deduct what was added)
        const producedStock = await ProductStock.findOne({
            where: {
                office_id: Number(log.office_id),
                product_id: Number(log.product_id),
                is_deleted: false
            },
            transaction: t
        });

        if (producedStock) {
            const currentQty = parseFloat(producedStock.quantity) || 0;
            const logQty = parseFloat(log.unit_produced) || 0;
            const newQty = currentQty - logQty;

            console.log(`📉 [DeleteProduction] Product Stock ${producedStock.stock_id}: ${currentQty} -> ${newQty} (Deducting ${logQty})`);

            producedStock.quantity = newQty;
            await producedStock.save({ transaction: t });
        } else {
            console.warn(`⚠️ [DeleteProduction] No active stock record found for product ${log.product_id} at office ${log.office_id}`);
        }

        // 2. Reverse Cement Stock (Add back what was used)
        if (log.cement_product_id && log.cement_used) {
            const cementStock = await ProductStock.findOne({
                where: {
                    office_id: Number(log.office_id),
                    product_id: Number(log.cement_product_id),
                    is_deleted: false
                },
                transaction: t
            });

            if (cementStock) {
                const currentCementQty = parseFloat(cementStock.quantity) || 0;
                const cementUsed = parseFloat(log.cement_used) || 0;
                const newCementQty = currentCementQty + cementUsed;

                console.log(`📈 [DeleteProduction] Cement Stock ${cementStock.stock_id}: ${currentCementQty} -> ${newCementQty} (Adding back ${cementUsed})`);

                cementStock.quantity = newCementQty;
                await cementStock.save({ transaction: t });
            } else {
                console.warn(`⚠️ [DeleteProduction] No active cement stock record found for ${log.cement_product_id} at office ${log.office_id}`);
            }
        }

        // 3. Soft Delete the Log
        log.is_deleted = true;
        log.deleted_at = new Date();
        await log.save({ transaction: t });

        await t.commit();
        console.log(`✅ [DeleteProduction] Successfully reversed stock and deleted log: ${req.params.id}`);
        res.json({ message: "Production log deleted and stock reversed" });
    } catch (err) {
        console.error(`❌ [DeleteProduction] Error:`, err);
        if (t) await t.rollback();
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
