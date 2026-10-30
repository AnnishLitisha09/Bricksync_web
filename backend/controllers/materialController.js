const db = require("../models");
const sequelize = db.sequelize;
const {
    MaterialSupplier,
    MaterialSupplierField,
    MaterialEntry,
    MaterialEntryField,
    MaterialStatement,
    ProductStock,
    BankTable,
} = db;

/**
 * SUPPLIERS
 */
exports.createSupplier = async (req, res) => {
    const {
        shop_name,
        owner_name,
        category,
        phone_no,
        address,
        balance,
        additional_fields,
        customFields,
        gst_number,
        notes,
        tags
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const supplier = await MaterialSupplier.create(
            {
                shop_name,
                owner_name,
                category,
                phone_no,
                address,
                balance: parseFloat(balance) || 0,
                gst_number: gst_number ? String(gst_number).trim() : null,
                notes: notes ? String(notes).trim() : null,
                tags: tags ? (Array.isArray(tags) ? tags.join(", ") : String(tags).trim()) : null,
            },
            { transaction }
        );

        const fieldsToCreate = additional_fields || customFields;
        if (fieldsToCreate && Array.isArray(fieldsToCreate)) {
            for (const field of fieldsToCreate) {
                const name = field.title || field.field_name || (typeof field === "string" ? field : "");
                if (!name) continue;

                await MaterialSupplierField.create(
                    {
                        supplier_id: supplier.id,
                        field_name: name,
                        field_options: JSON.stringify(field.options || field.field_options || []),
                    },
                    { transaction }
                );
            }
        }

        await transaction.commit();

        const createdSupplier = await MaterialSupplier.findByPk(supplier.id, {
            include: [{ model: MaterialSupplierField, as: "additionalFields" }],
        });

        res.status(201).json({ success: true, data: createdSupplier || supplier });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("CREATE SUPPLIER ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllSuppliers = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const search = req.query.search || "";
        const { Op } = require("sequelize");

        const where = {};
        if (search) {
            where[Op.or] = [
                { shop_name: { [Op.like]: `%${search}%` } },
                { owner_name: { [Op.like]: `%${search}%` } },
                { phone_no: { [Op.like]: `%${search}%` } },
                { gst_number: { [Op.like]: `%${search}%` } },
                { tags: { [Op.like]: `%${search}%` } },
            ];
        }

        const queryOptions = {
            where,
            include: [{ model: MaterialSupplierField, as: "additionalFields" }],
            order: [["createdAt", "DESC"]],
            distinct: true,
        };

        if (page) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
            const { count, rows } = await MaterialSupplier.findAndCountAll(queryOptions);
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

        const data = await MaterialSupplier.findAll(queryOptions);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSupplierById = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await MaterialSupplier.findByPk(id, {
            include: [{ model: MaterialSupplierField, as: "additionalFields" }],
        });
        if (!data) return res.status(404).json({ success: false, message: "Supplier not found" });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateSupplier = async (req, res) => {
    const { id } = req.params;
    const {
        shop_name,
        owner_name,
        category,
        phone_no,
        address,
        additional_fields,
        customFields,
        gst_number,
        notes,
        tags
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
        const supplier = await MaterialSupplier.findByPk(id, { transaction });
        if (!supplier) throw new Error("Supplier not found");

        const updateData = {
            shop_name: shop_name !== undefined ? shop_name : supplier.shop_name,
            owner_name: owner_name !== undefined ? owner_name : supplier.owner_name,
            category: category !== undefined ? category : supplier.category,
            phone_no: phone_no !== undefined ? phone_no : supplier.phone_no,
            address: address !== undefined ? address : supplier.address,
            gst_number: gst_number !== undefined ? (gst_number ? String(gst_number).trim() : null) : supplier.gst_number,
            notes: notes !== undefined ? (notes ? String(notes).trim() : null) : supplier.notes,
            tags: tags !== undefined ? (Array.isArray(tags) ? tags.join(", ") : (tags ? String(tags).trim() : null)) : supplier.tags,
        };

        await supplier.update(updateData, { transaction });

        const fieldsToUpdate = additional_fields || customFields;
        if (fieldsToUpdate && Array.isArray(fieldsToUpdate)) {
            await MaterialSupplierField.destroy({ where: { supplier_id: id }, transaction });
            for (const field of fieldsToUpdate) {
                const name = field.title || field.field_name || (typeof field === "string" ? field : "");
                if (!name) continue;

                await MaterialSupplierField.create(
                    {
                        supplier_id: id,
                        field_name: name,
                        field_options: JSON.stringify(field.options || field.field_options || []),
                    },
                    { transaction }
                );
            }
        }

        await transaction.commit();

        const updated = await MaterialSupplier.findByPk(id, {
            include: [{ model: MaterialSupplierField, as: "additionalFields" }],
        });

        res.json({ success: true, data: updated || supplier });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("UPDATE SUPPLIER ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    const { id } = req.params;
    try {
        const entryCount = await MaterialEntry.count({ where: { supplier_id: id } });
        const statementCount = await MaterialStatement.count({ where: { supplier_id: id } });

        if (entryCount > 0 || statementCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete supplier with existing transactions. Delete transactions first."
            });
        }

        await MaterialSupplier.destroy({ where: { id } });
        res.json({ success: true, message: "Supplier deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * ENTRIES (PROCUREMENT)
 */
exports.createMaterialEntry = async (req, res) => {
    const { supplier_id, date, product_id, office_id, units, amount, fields, unit_price } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const parsedUnits = parseFloat(units) || 0;
        const parsedAmount = parseFloat(amount) || 0;
        const parsedUnitPrice = unit_price !== undefined && unit_price !== null && unit_price !== ""
            ? parseFloat(unit_price)
            : (parsedUnits > 0 ? parseFloat((parsedAmount / parsedUnits).toFixed(2)) : 0);

        // 1. Create Entry
        const entry = await MaterialEntry.create(
            {
                supplier_id,
                date: date || new Date(),
                product_id,
                office_id,
                units: parsedUnits,
                unit_price: parsedUnitPrice,
                amount: parsedAmount,
            },
            { transaction }
        );

        // 2. Additional Fields
        if (fields && typeof fields === "object") {
            const fieldEntries = Object.entries(fields).map(([name, value]) => ({
                entry_id: entry.id,
                field_name: name,
                field_value: value !== null && value !== undefined ? String(value) : "",
            }));
            await MaterialEntryField.bulkCreate(fieldEntries, { transaction });
        }

        // 3. Update Stock
        const [stock] = await ProductStock.findOrCreate({
            where: { product_id, office_id },
            defaults: { quantity: 0 },
            transaction,
        });
        await stock.increment("quantity", { by: parsedUnits, transaction });

        // 4. Update Supplier Balance
        const supplier = await MaterialSupplier.findByPk(supplier_id, { transaction });
        if (supplier) {
            await supplier.increment("balance", { by: parsedAmount, transaction });
        }

        await transaction.commit();

        const createdEntry = await MaterialEntry.findByPk(entry.id, {
            include: [
                { model: MaterialEntryField, as: "fields" },
                { model: db.Product, as: "product" },
                { model: db.Office, as: "office" },
            ],
        });

        res.status(201).json({ success: true, data: createdEntry || entry });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("CREATE MATERIAL ENTRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEntriesBySupplier = async (req, res) => {
    const { supplierId } = req.params;
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const queryOptions = {
            where: { supplier_id: supplierId },
            include: [
                { model: MaterialEntryField, as: "fields" },
                { model: db.Product, as: "product" },
                { model: db.Office, as: "office" },
            ],
            order: [["date", "DESC"]],
            distinct: true,
        };

        if (page) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
            const { count, rows } = await MaterialEntry.findAndCountAll(queryOptions);
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

        const data = await MaterialEntry.findAll(queryOptions);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateMaterialEntry = async (req, res) => {
    const { id } = req.params;
    const { date, product_id, office_id, units, amount, fields, unit_price } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const entry = await MaterialEntry.findByPk(id, { transaction });
        if (!entry) throw new Error("Entry not found");

        const parsedUnits = parseFloat(units) || 0;
        const parsedAmount = parseFloat(amount) || 0;
        const parsedUnitPrice = unit_price !== undefined && unit_price !== null && unit_price !== ""
            ? parseFloat(unit_price)
            : (parsedUnits > 0 ? parseFloat((parsedAmount / parsedUnits).toFixed(2)) : 0);

        // 1. REVERSE OLD STOCK & BALANCE
        const oldStock = await ProductStock.findOne({
            where: { product_id: entry.product_id, office_id: entry.office_id },
            transaction,
        });
        if (oldStock) {
            await oldStock.decrement("quantity", { by: parseFloat(entry.units) || 0, transaction });
        }

        const oldSupplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        if (oldSupplier) {
            await oldSupplier.decrement("balance", { by: parseFloat(entry.amount) || 0, transaction });
        }

        // 2. UPDATE ENTRY
        const targetProductId = product_id ? Number(product_id) : entry.product_id;
        const targetOfficeId = office_id ? Number(office_id) : entry.office_id;

        await entry.update(
            {
                date: date || entry.date,
                product_id: targetProductId,
                office_id: targetOfficeId,
                units: parsedUnits,
                unit_price: parsedUnitPrice,
                amount: parsedAmount,
            },
            { transaction }
        );

        // 3. UPDATE FIELDS
        if (fields && typeof fields === "object") {
            await MaterialEntryField.destroy({ where: { entry_id: id }, transaction });
            const fieldEntries = Object.entries(fields).map(([name, value]) => ({
                entry_id: id,
                field_name: name,
                field_value: value !== null && value !== undefined ? String(value) : "",
            }));
            await MaterialEntryField.bulkCreate(fieldEntries, { transaction });
        }

        // 4. APPLY NEW STOCK & BALANCE
        const [newStock] = await ProductStock.findOrCreate({
            where: { product_id: targetProductId, office_id: targetOfficeId },
            defaults: { quantity: 0 },
            transaction,
        });
        await newStock.increment("quantity", { by: parsedUnits, transaction });

        const newSupplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        if (newSupplier) {
            await newSupplier.increment("balance", { by: parsedAmount, transaction });
        }

        await transaction.commit();

        const updatedEntry = await MaterialEntry.findByPk(id, {
            include: [
                { model: MaterialEntryField, as: "fields" },
                { model: db.Product, as: "product" },
                { model: db.Office, as: "office" },
            ],
        });

        res.json({ success: true, data: updatedEntry || entry });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("UPDATE MATERIAL ENTRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteMaterialEntry = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const entry = await MaterialEntry.findByPk(id, { transaction });
        if (!entry) throw new Error("Entry not found");

        // 1. REVERSE STOCK & BALANCE
        const stock = await ProductStock.findOne({
            where: { product_id: entry.product_id, office_id: entry.office_id },
            transaction,
        });
        if (stock) {
            await stock.decrement("quantity", { by: parseFloat(entry.units) || 0, transaction });
        }

        const supplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        if (supplier) {
            await supplier.decrement("balance", { by: parseFloat(entry.amount) || 0, transaction });
        }

        // 2. DELETE
        await entry.destroy({ transaction });

        await transaction.commit();
        res.json({ success: true, message: "Entry deleted" });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("DELETE MATERIAL ENTRY ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * STATEMENTS (PAYMENTS)
 */
exports.createMaterialStatement = async (req, res) => {
    const { supplier_id, bank_id, amount, payment_mode, description } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const parsedAmount = parseFloat(amount) || 0;
        const bank = await BankTable.findByPk(bank_id, { transaction });
        if (!bank) throw new Error("Bank not found");
        if (bank.amount < parsedAmount) throw new Error("Insufficient bank balance");

        const supplier = await MaterialSupplier.findByPk(supplier_id, { transaction });
        if (!supplier) throw new Error("Supplier not found");

        // 1. Create Statement
        const statement = await MaterialStatement.create(
            { supplier_id, bank_id, amount: parsedAmount, payment_mode, description },
            { transaction }
        );

        // 2. Deduct Bank Amount
        await bank.decrement("amount", { by: parsedAmount, transaction });

        // 3. Deduct Supplier Balance
        await supplier.decrement("balance", { by: parsedAmount, transaction });

        await transaction.commit();
        res.status(201).json({ success: true, data: statement });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStatementsBySupplier = async (req, res) => {
    const { supplierId } = req.params;
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const queryOptions = {
            where: { supplier_id: supplierId },
            include: [{ model: BankTable, as: "bank" }],
            order: [["createdAt", "DESC"]],
            distinct: true,
        };

        if (page) {
            queryOptions.limit = limit;
            queryOptions.offset = (page - 1) * limit;
            const { count, rows } = await MaterialStatement.findAndCountAll(queryOptions);
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

        const data = await MaterialStatement.findAll(queryOptions);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateMaterialStatement = async (req, res) => {
    const { id } = req.params;
    const { bank_id, amount, payment_mode, description } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const statement = await MaterialStatement.findByPk(id, { transaction });
        if (!statement) throw new Error("Statement not found");

        const parsedAmount = parseFloat(amount) || 0;
        const oldAmount = parseFloat(statement.amount) || 0;

        // 1. REVERSE OLD BANK & SUPPLIER BALANCE
        const oldBank = await BankTable.findByPk(statement.bank_id, { transaction });
        if (oldBank) {
            await oldBank.increment("amount", { by: oldAmount, transaction });
        }

        const oldSupplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        if (oldSupplier) {
            await oldSupplier.increment("balance", { by: oldAmount, transaction });
        }

        // 2. UPDATE STATEMENT
        await statement.update({ bank_id, amount: parsedAmount, payment_mode, description }, { transaction });

        // 3. APPLY NEW BANK & SUPPLIER BALANCE
        const newBank = await BankTable.findByPk(bank_id, { transaction });
        if (!newBank) throw new Error("Bank not found");
        if (newBank.amount < parsedAmount) throw new Error("Insufficient bank balance");

        await newBank.decrement("amount", { by: parsedAmount, transaction });

        const newSupplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        if (newSupplier) {
            await newSupplier.decrement("balance", { by: parsedAmount, transaction });
        }

        await transaction.commit();
        res.json({ success: true, data: statement });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteMaterialStatement = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const statement = await MaterialStatement.findByPk(id, { transaction });
        if (!statement) throw new Error("Statement not found");

        const oldAmount = parseFloat(statement.amount) || 0;

        // 1. REVERSE BANK & SUPPLIER BALANCE
        const bank = await BankTable.findByPk(statement.bank_id, { transaction });
        if (bank) {
            await bank.increment("amount", { by: oldAmount, transaction });
        }

        const supplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        if (supplier) {
            await supplier.increment("balance", { by: oldAmount, transaction });
        }

        // 2. DELETE
        await statement.destroy({ transaction });

        await transaction.commit();
        res.json({ success: true, message: "Statement deleted" });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};
