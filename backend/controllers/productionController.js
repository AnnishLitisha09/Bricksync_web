const { ProductionLog, ProductionEmployee, ProductStock, Office, Product, User, ProductionRecipe, ProductionRecipeItem, sequelize } = require("../models");
const { Op } = require("sequelize");

/* 🔹 Get All Production Mix Recipes */
exports.getProductionRecipes = async (req, res) => {
    try {
        const { office_id } = req.query;
        const where = { is_active: true };
        if (office_id) {
            where.office_id = Number(office_id);
        }

        const recipes = await ProductionRecipe.findAll({
            where,
            include: [
                { model: Office, as: "office", attributes: ["office_id", "office_name"] },
                { model: Product, as: "product", attributes: ["product_id", "product_name", "category"] },
                {
                    model: ProductionRecipeItem,
                    as: "items",
                    include: [
                        { model: Product, as: "materialProduct", attributes: ["product_id", "product_name", "category", "price_per_stock"] }
                    ]
                }
            ],
            order: [["office_id", "ASC"], ["created_at", "DESC"]]
        });

        const formatted = recipes.map(r => {
            const batch = parseFloat(r.batch_bricks) || 1000;
            const items = (r.items || []).map(item => {
                const qty = parseFloat(item.quantity) || 0;
                const perBrick = batch > 0 ? (qty / batch) : 0;
                const per1000 = perBrick * 1000;
                return {
                    id: item.id,
                    material_product_id: item.material_product_id,
                    material_name: item.material_name,
                    quantity: qty,
                    unit: item.unit,
                    is_cement: Boolean(item.is_cement),
                    qty_per_brick: parseFloat(perBrick.toFixed(5)),
                    qty_per_1000: parseFloat(per1000.toFixed(3)),
                    materialProduct: item.materialProduct
                };
            });

            return {
                id: r.id,
                office_id: r.office_id,
                office_name: r.office?.office_name || "Factory Plant",
                product_id: r.product_id,
                product_name: r.product?.product_name || "Brick Product",
                batch_bricks: batch,
                description: r.description,
                is_active: r.is_active,
                created_at: r.created_at,
                items
            };
        });

        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error("Failed to get recipes:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Get Recipe by ID */
exports.getProductionRecipeById = async (req, res) => {
    try {
        const recipe = await ProductionRecipe.findByPk(req.params.id, {
            include: [
                { model: Office, as: "office" },
                { model: Product, as: "product" },
                {
                    model: ProductionRecipeItem,
                    as: "items",
                    include: [{ model: Product, as: "materialProduct" }]
                }
            ]
        });

        if (!recipe) {
            return res.status(404).json({ success: false, message: "Mix recipe not found" });
        }

        const batch = parseFloat(recipe.batch_bricks) || 1000;
        const items = (recipe.items || []).map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const perBrick = batch > 0 ? (qty / batch) : 0;
            return {
                id: item.id,
                material_product_id: item.material_product_id,
                material_name: item.material_name,
                quantity: qty,
                unit: item.unit,
                is_cement: Boolean(item.is_cement),
                qty_per_brick: parseFloat(perBrick.toFixed(5)),
                qty_per_1000: parseFloat((perBrick * 1000).toFixed(3)),
                materialProduct: item.materialProduct
            };
        });

        res.json({
            success: true,
            data: {
                ...recipe.toJSON(),
                items
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Estimate Raw Materials Needed for Batch (BOM Calculation) */
exports.getRecipeEstimate = async (req, res) => {
    try {
        const { office_id, product_id, unit_produced } = req.query;
        if (!office_id || !product_id) {
            return res.status(400).json({ success: false, message: "office_id and product_id are required" });
        }

        const producedUnits = parseFloat(unit_produced || 1000);
        const recipe = await ProductionRecipe.findOne({
            where: { office_id: Number(office_id), product_id: Number(product_id), is_active: true },
            include: [
                {
                    model: ProductionRecipeItem,
                    as: "items",
                    include: [{ model: Product, as: "materialProduct" }]
                }
            ]
        });

        if (!recipe) {
            return res.json({
                success: true,
                has_recipe: false,
                message: "No mix ratio configured for this office and product. Standard entry applied.",
                estimated_materials: []
            });
        }

        const batch = parseFloat(recipe.batch_bricks) || 1000;
        const multiplier = producedUnits / batch;

        const estimatedMaterials = (recipe.items || []).map(item => {
            const baseQty = parseFloat(item.quantity) || 0;
            const required = parseFloat((baseQty * multiplier).toFixed(3));
            const perBrick = parseFloat((baseQty / batch).toFixed(5));

            return {
                material_product_id: item.material_product_id,
                material_name: item.material_name,
                unit: item.unit,
                is_cement: Boolean(item.is_cement),
                base_qty: baseQty,
                required_qty: required,
                qty_per_brick: perBrick,
                materialProduct: item.materialProduct
            };
        });

        const cementEstimate = estimatedMaterials.find(m => m.is_cement);

        res.json({
            success: true,
            has_recipe: true,
            recipe_id: recipe.id,
            recipe_description: recipe.description,
            batch_bricks: batch,
            unit_produced: producedUnits,
            cement_estimate: cementEstimate ? cementEstimate.required_qty : null,
            estimated_materials: estimatedMaterials
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Create or Update (Upsert) Mix Recipe */
exports.upsertProductionRecipe = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { office_id, product_id, batch_bricks, description, items } = req.body;

        if (!office_id || !product_id) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Office and Brick Product are required" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "At least one raw material item is required" });
        }

        const batchBricksNum = parseFloat(batch_bricks || 1000);

        // Find or create recipe for this office and product
        let recipe = await ProductionRecipe.findOne({
            where: { office_id: Number(office_id), product_id: Number(product_id) },
            transaction: t
        });

        if (recipe) {
            recipe.batch_bricks = batchBricksNum;
            recipe.description = description || recipe.description;
            recipe.is_active = true;
            await recipe.save({ transaction: t });
            // Remove old items
            await ProductionRecipeItem.destroy({ where: { recipe_id: recipe.id }, transaction: t });
        } else {
            recipe = await ProductionRecipe.create({
                office_id: Number(office_id),
                product_id: Number(product_id),
                batch_bricks: batchBricksNum,
                description: description || `Mix ratio for product ${product_id} at office ${office_id}`,
                is_active: true
            }, { transaction: t });
        }

        // Insert new items
        const itemRows = items.map(item => ({
            recipe_id: recipe.id,
            material_product_id: item.material_product_id ? Number(item.material_product_id) : null,
            material_name: item.material_name || "Raw Material",
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit || "Units",
            is_cement: Boolean(item.is_cement || item.material_name?.toLowerCase().includes("cement"))
        }));

        await ProductionRecipeItem.bulkCreate(itemRows, { transaction: t });

        await t.commit();
        res.status(201).json({
            success: true,
            message: "Production mix ratio saved successfully!",
            recipeId: recipe.id
        });
    } catch (err) {
        await t.rollback();
        console.error("Upsert recipe error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Delete Mix Recipe */
exports.deleteProductionRecipe = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const recipe = await ProductionRecipe.findByPk(req.params.id, { transaction: t });
        if (!recipe) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Mix recipe not found" });
        }

        await ProductionRecipeItem.destroy({ where: { recipe_id: recipe.id }, transaction: t });
        await recipe.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true, message: "Mix recipe deleted successfully" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Create Production Log with Full BOM Raw Material Deduction */
exports.createProduction = async (req, res) => {
    console.log("Creating production log with body:", req.body);
    const t = await sequelize.transaction();
    try {
        const { office_id, product_id, unit_produced, cement_used, cement_product_id, production_date, employee_ids, number_of_stocks, price_per_stock } = req.body;

        const producedUnits = parseFloat(unit_produced || 0);
        if (producedUnits <= 0) {
            await t.rollback();
            return res.status(400).json({ error: "Units produced must be greater than zero." });
        }

        // 🔹 1. PRE-VALIDATION: Check Cement Stock Availability
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
                    error: `Insufficient cement stock. Available: ${availableQty} Bags, Required: ${requiredQty} Bags`
                });
            }
        }

        // 🔹 2. FETCH OFFICE-SPECIFIC MIX RECIPE (BOM)
        const recipe = await ProductionRecipe.findOne({
            where: { office_id: Number(office_id), product_id: Number(product_id), is_active: true },
            include: [{ model: ProductionRecipeItem, as: "items" }],
            transaction: t
        });

        const rawMaterialsSnapshot = [];
        const batchBricks = recipe ? (parseFloat(recipe.batch_bricks) || 1000) : 1000;
        const multiplier = producedUnits / batchBricks;

        if (recipe && recipe.items && recipe.items.length > 0) {
            for (const item of recipe.items) {
                const standardQty = parseFloat((parseFloat(item.quantity) * multiplier).toFixed(3));
                const isCement = Boolean(item.is_cement || (cement_product_id && item.material_product_id === Number(cement_product_id)));

                let actualQty = standardQty;
                let varianceDiff = 0;
                let varianceStatus = "OPTIMAL";

                if (isCement) {
                    actualQty = parseFloat(cement_used || standardQty);
                    varianceDiff = parseFloat((actualQty - standardQty).toFixed(2));
                    const threshold = standardQty * 0.05; // 5% allowance
                    if (varianceDiff > threshold) {
                        varianceStatus = "HIGH";
                    } else if (varianceDiff < -threshold) {
                        varianceStatus = "LOW";
                    } else {
                        varianceStatus = "OPTIMAL";
                    }
                } else {
                    // Deduct other raw materials (dust, fly ash, etc.) from ProductStock
                    if (item.material_product_id) {
                        const [matStock] = await ProductStock.findOrCreate({
                            where: { office_id: Number(office_id), product_id: Number(item.material_product_id) },
                            defaults: { quantity: 0 },
                            transaction: t
                        });
                        matStock.quantity = parseFloat(matStock.quantity) - standardQty;
                        await matStock.save({ transaction: t });
                        console.log(`📉 Auto-deducted raw material ${item.material_name}: -${standardQty} ${item.unit}. New Stock: ${matStock.quantity}`);
                    }
                }

                rawMaterialsSnapshot.push({
                    material_product_id: item.material_product_id,
                    material_name: item.material_name,
                    unit: item.unit,
                    is_cement: isCement,
                    standard_qty: standardQty,
                    actual_qty: actualQty,
                    qty_per_brick: parseFloat((standardQty / producedUnits).toFixed(5)),
                    variance: varianceDiff,
                    variance_status: varianceStatus
                });
            }
        }

        // 🔹 3. CREATE PRODUCTION LOG
        const log = await ProductionLog.create(
            {
                office_id: Number(office_id),
                product_id: Number(product_id),
                unit_produced: producedUnits,
                cement_used: parseFloat(cement_used || 0),
                cement_product_id: cement_product_id ? Number(cement_product_id) : null,
                production_date,
                number_of_stocks: parseInt(number_of_stocks || 0),
                price_per_stock: parseFloat(price_per_stock || 0),
                raw_materials_used: rawMaterialsSnapshot.length > 0 ? rawMaterialsSnapshot : null
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

        // 🔹 4. UPDATE FINISHED BRICK STOCK
        const [stock] = await ProductStock.findOrCreate({
            where: { office_id: Number(office_id), product_id: Number(product_id) },
            defaults: { quantity: 0 },
            transaction: t,
        });

        stock.quantity = parseFloat(stock.quantity) + producedUnits;
        await stock.save({ transaction: t });

        // 🔹 5. DEDUCT CEMENT STOCK
        if (cement_product_id && cement_used) {
            const cementId = Number(cement_product_id);
            const cementQty = parseFloat(cement_used);

            if (!isNaN(cementId) && cementId > 0 && !isNaN(cementQty) && cementQty > 0) {
                const [cementStock] = await ProductStock.findOrCreate({
                    where: { office_id: Number(office_id), product_id: cementId },
                    defaults: { quantity: 0 },
                    transaction: t,
                });

                cementStock.quantity = parseFloat(cementStock.quantity) - cementQty;
                await cementStock.save({ transaction: t });
                console.log(`📉 Deducted Cement ${cementId}: -${cementQty} Bags. New Qty: ${cementStock.quantity}`);
            }
        }

        await t.commit();
        res.status(201).json({ message: "Production logged, finished stock added & raw materials deducted", log });
    } catch (err) {
        await t.rollback();
        console.error("Create production error:", err);
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Get Production History */
exports.getProductionHistory = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const officeId = req.query.office_id;

        const where = { is_deleted: false };
        if (officeId) {
            where.office_id = officeId;
        }

        const queryOptions = {
            where,
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
            order: [["production_date", "DESC"], ["created_at", "DESC"]],
            distinct: true,
        };

        if (page) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
            const { count, rows } = await ProductionLog.findAndCountAll(queryOptions);
            return res.json({
                data: rows,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        }

        const history = await ProductionLog.findAll(queryOptions);
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
                { model: Product, as: "cementProduct" },
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
            if (t) await t.rollback();
            return res.status(404).json({ message: "Production log not found" });
        }

        const { unit_produced, office_id, product_id } = req.body;

        // 1. Update Produced Product Stock
        if (unit_produced !== undefined || product_id !== undefined || office_id !== undefined) {
            const oldQty = parseFloat(log.unit_produced) || 0;
            const newQty = parseFloat(unit_produced !== undefined ? unit_produced : log.unit_produced) || 0;
            const oldProdId = log.product_id;
            const newProdId = product_id || log.product_id;
            const oldOffId = log.office_id;
            const newOffId = office_id || log.office_id;

            if (oldProdId === newProdId && oldOffId === newOffId) {
                const diff = newQty - oldQty;
                if (diff !== 0) {
                    const stock = await ProductStock.findOne({
                        where: { office_id: newOffId, product_id: newProdId, is_deleted: false },
                        transaction: t
                    });
                    if (stock) {
                        stock.quantity = parseFloat(stock.quantity) + diff;
                        await stock.save({ transaction: t });
                    }
                }
            } else {
                const oldStock = await ProductStock.findOne({
                    where: { office_id: oldOffId, product_id: oldProdId, is_deleted: false },
                    transaction: t
                });
                if (oldStock) {
                    oldStock.quantity = parseFloat(oldStock.quantity) - oldQty;
                    await oldStock.save({ transaction: t });
                }
                const [newStock] = await ProductStock.findOrCreate({
                    where: { office_id: newOffId, product_id: newProdId, is_deleted: false },
                    defaults: { quantity: 0 },
                    transaction: t
                });
                newStock.quantity = parseFloat(newStock.quantity) + newQty;
                await newStock.save({ transaction: t });
            }
        }

        await log.update(req.body, { transaction: t });
        await t.commit();
        res.json({ message: "Production log and stock updated successfully" });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Soft Delete Production Log with Full Stock Reversal & Salary Reversal */
exports.deleteProduction = async (req, res) => {
    console.log(`🗑️ [DeleteProduction] Starting deletion for ID: ${req.params.id}`);
    const t = await sequelize.transaction();
    try {
        const log = await ProductionLog.findOne({
            where: { production_id: req.params.id, is_deleted: false },
            transaction: t
        });

        if (!log) {
            if (t) await t.rollback();
            return res.status(404).json({ message: "Production log not found" });
        }

        const officeId = Number(log.office_id);
        const productId = Number(log.product_id);
        const unitsProduced = parseFloat(log.unit_produced) || 0;
        const cementId = log.cement_product_id ? Number(log.cement_product_id) : null;
        const cementUsed = parseFloat(log.cement_used) || 0;

        // 1. Reverse Produced Item Stock (Deduct what was added during manufacturing)
        if (unitsProduced > 0) {
            const [producedStock] = await ProductStock.findOrCreate({
                where: { office_id: officeId, product_id: productId },
                defaults: { quantity: 0 },
                transaction: t
            });

            const currentQty = parseFloat(producedStock.quantity) || 0;
            const newQty = Math.max(0, currentQty - unitsProduced);
            producedStock.quantity = newQty.toFixed(2);
            await producedStock.save({ transaction: t });
            console.log(`📉 Reduced manufactured brick stock (Product ${productId} at Office ${officeId}): -${unitsProduced}. New Qty: ${producedStock.quantity}`);
        }

        // 2. Reverse Cement Stock (Add back what was used)
        let cementRestored = false;
        if (cementId && cementUsed > 0) {
            const [cementStock] = await ProductStock.findOrCreate({
                where: { office_id: officeId, product_id: cementId },
                defaults: { quantity: 0 },
                transaction: t
            });

            const currentCement = parseFloat(cementStock.quantity) || 0;
            cementStock.quantity = (currentCement + cementUsed).toFixed(2);
            await cementStock.save({ transaction: t });
            cementRestored = true;
            console.log(`📈 Restored cement stock (Product ${cementId} at Office ${officeId}): +${cementUsed} Bags. New Qty: ${cementStock.quantity}`);
        }

        // 3. Reverse Other Raw Materials (Dust, Chips, Sand, etc. recorded in raw_materials_used)
        let rawMats = log.raw_materials_used;
        if (typeof rawMats === "string") {
            try {
                rawMats = JSON.parse(rawMats);
            } catch (e) {
                console.error("Failed to parse raw_materials_used JSON string:", e.message);
                rawMats = null;
            }
        }

        let materialsRestored = false;
        if (Array.isArray(rawMats) && rawMats.length > 0) {
            for (const mat of rawMats) {
                const matProdId = mat.material_product_id ? Number(mat.material_product_id) : null;
                const qtyToRestore = parseFloat(mat.actual_qty ?? mat.standard_qty ?? 0);

                if (mat.is_cement) {
                    if (!cementRestored && matProdId && qtyToRestore > 0) {
                        const [cStock] = await ProductStock.findOrCreate({
                            where: { office_id: officeId, product_id: matProdId },
                            defaults: { quantity: 0 },
                            transaction: t
                        });
                        cStock.quantity = ((parseFloat(cStock.quantity) || 0) + qtyToRestore).toFixed(2);
                        await cStock.save({ transaction: t });
                        cementRestored = true;
                        console.log(`📈 Restored cement from raw_materials_used (Product ${matProdId}): +${qtyToRestore} Bags`);
                    }
                } else if (matProdId && qtyToRestore > 0) {
                    const [rawStock] = await ProductStock.findOrCreate({
                        where: { office_id: officeId, product_id: matProdId },
                        defaults: { quantity: 0 },
                        transaction: t
                    });
                    const currentRawQty = parseFloat(rawStock.quantity) || 0;
                    rawStock.quantity = (currentRawQty + qtyToRestore).toFixed(2);
                    await rawStock.save({ transaction: t });
                    materialsRestored = true;
                    console.log(`📈 Restored raw material (Product ${matProdId} - ${mat.material_name || 'Material'}): +${qtyToRestore} ${mat.unit || 'Units'}. New Qty: ${rawStock.quantity}`);
                }
            }
        }

        // Fallback: If raw_materials_used was not saved on the log, look up the active ProductionRecipe for this product and office
        if (!materialsRestored && unitsProduced > 0) {
            try {
                const recipe = await ProductionRecipe.findOne({
                    where: { office_id: officeId, product_id: productId, is_active: true },
                    include: [{ model: ProductionRecipeItem, as: "items" }],
                    transaction: t
                });

                if (recipe && Array.isArray(recipe.items) && recipe.items.length > 0) {
                    const batchBricks = parseFloat(recipe.batch_bricks) || 1000;
                    const multiplier = unitsProduced / batchBricks;

                    for (const item of recipe.items) {
                        const itemMatId = item.material_product_id ? Number(item.material_product_id) : null;
                        const standardQty = parseFloat((parseFloat(item.quantity) * multiplier).toFixed(3));

                        if (item.is_cement) {
                            if (!cementRestored && itemMatId && standardQty > 0) {
                                const [cStock] = await ProductStock.findOrCreate({
                                    where: { office_id: officeId, product_id: itemMatId },
                                    defaults: { quantity: 0 },
                                    transaction: t
                                });
                                cStock.quantity = ((parseFloat(cStock.quantity) || 0) + standardQty).toFixed(2);
                                await cStock.save({ transaction: t });
                                cementRestored = true;
                                console.log(`📈 Restored cement from recipe BOM (Product ${itemMatId}): +${standardQty} Bags`);
                            }
                        } else if (itemMatId && standardQty > 0) {
                            const [rawStock] = await ProductStock.findOrCreate({
                                where: { office_id: officeId, product_id: itemMatId },
                                defaults: { quantity: 0 },
                                transaction: t
                            });
                            const currentRawQty = parseFloat(rawStock.quantity) || 0;
                            rawStock.quantity = (currentRawQty + standardQty).toFixed(2);
                            await rawStock.save({ transaction: t });
                            console.log(`📈 Restored raw material from BOM Recipe ${item.material_name || ''} (Product ${itemMatId}): +${standardQty} ${item.unit || 'Units'}. New Qty: ${rawStock.quantity}`);
                        }
                    }
                }
            } catch (recipeErr) {
                console.warn("Could not fallback to ProductionRecipe on deletion:", recipeErr.message);
            }
        }

        // 4. Soft Delete associated ProductionEmployee assignments (Reverting operator wages)
        await ProductionEmployee.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { production_id: log.production_id }, transaction: t }
        );
        console.log(`👥 Soft-deleted ProductionEmployee records for production_id: ${log.production_id}`);

        // 5. Soft Delete the Production Log
        log.is_deleted = true;
        log.deleted_at = new Date();
        await log.save({ transaction: t });

        await t.commit();
        res.json({
            success: true,
            message: "Production log deleted, manufactured product stock reduced, raw materials restored, and staff wages reversed successfully"
        });
    } catch (err) {
        if (t) await t.rollback();
        console.error("Delete production error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

/* 🔹 Restore Production Log */
exports.restoreProduction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const [updated] = await ProductionLog.update(
            { is_deleted: false, deleted_at: null },
            { where: { production_id: req.params.id }, transaction: t }
        );
        if (!updated) {
            await t.rollback();
            return res.status(404).json({ message: "Production log not found" });
        }

        await ProductionEmployee.update(
            { is_deleted: false, deleted_at: null },
            { where: { production_id: req.params.id }, transaction: t }
        );

        await t.commit();
        res.json({ message: "Production log and employee assignments restored" });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Today's Production Logs */
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
