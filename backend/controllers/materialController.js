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
    const { shop_name, owner_name, category, phone_no, address, balance, additional_fields, customFields } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const supplier = await MaterialSupplier.create(
            { shop_name, owner_name, category, phone_no, address, balance: balance || 0 },
            { transaction }
        );

        const fieldsToCreate = additional_fields || customFields;
        if (fieldsToCreate && Array.isArray(fieldsToCreate)) {
            for (const field of fieldsToCreate) {
                const name = field.title || field.field_name || (typeof field === 'string' ? field : '');
                if (!name) continue;

                console.log("Creating field for supplier:", supplier.id);
                console.log("Field Name:", name);
                console.log("Field Options:", field.options || []);

                await MaterialSupplierField.create({
                    supplier_id: supplier.id,
                    field_name: name,
                    field_options: JSON.stringify(field.options || []),
                }, { transaction });
            }
        }

        await transaction.commit();
        res.status(201).json({ success: true, data: supplier });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("CREATE SUPPLIER ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllSuppliers = async (req, res) => {
    try {
        const data = await MaterialSupplier.findAll({
            include: [{ model: MaterialSupplierField, as: "additionalFields" }],
            order: [["createdAt", "DESC"]],
        });
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
    const { shop_name, owner_name, category, phone_no, address, additional_fields, customFields } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const supplier = await MaterialSupplier.findByPk(id, { transaction });
        if (!supplier) throw new Error("Supplier not found");

        await supplier.update({ shop_name, owner_name, category, phone_no, address }, { transaction });

        const fieldsToUpdate = additional_fields || customFields;
        if (fieldsToUpdate && Array.isArray(fieldsToUpdate)) {
            // Simplest approach: Delete old fields and recreate
            await MaterialSupplierField.destroy({ where: { supplier_id: id }, transaction });
            for (const field of fieldsToUpdate) {
                const name = field.title || field.field_name || (typeof field === 'string' ? field : '');
                if (!name) continue;

                await MaterialSupplierField.create({
                    supplier_id: id,
                    field_name: name,
                    field_options: JSON.stringify(field.options || field.field_options || []),
                }, { transaction });
            }
        }

        await transaction.commit();
        res.json({ success: true, data: supplier });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSupplier = async (req, res) => {
    const { id } = req.params;
    try {
        // Check for dependencies? MaterialEntry, MaterialStatement
        const entryCount = await MaterialEntry.count({ where: { supplier_id: id } });
        const statementCount = await MaterialStatement.count({ where: { supplier_id: id } });

        if (entryCount > 0 || statementCount > 0) {
            return res.status(400).json({ success: false, message: "Cannot delete supplier with existing transactions. Delete transactions first." });
        }

        await MaterialSupplier.destroy({ where: { id } });
        res.json({ success: true, message: "Supplier deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * ENTRIES
 */
exports.createMaterialEntry = async (req, res) => {
    const { supplier_id, date, product_id, office_id, units, amount, fields } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // 1. Create Entry
        const entry = await MaterialEntry.create(
            { supplier_id, date, product_id, office_id, units, amount },
            { transaction }
        );

        // 2. Additional Fields
        if (fields && typeof fields === "object") {
            const fieldEntries = Object.entries(fields).map(([name, value]) => ({
                entry_id: entry.id,
                field_name: name,
                field_value: value,
            }));
            await MaterialEntryField.bulkCreate(fieldEntries, { transaction });
        }

        // 3. Update Stock
        const [stock] = await ProductStock.findOrCreate({
            where: { product_id, office_id },
            defaults: { quantity: 0 },
            transaction,
        });
        await stock.increment("quantity", { by: units, transaction });

        // 4. Update Supplier Balance
        const supplier = await MaterialSupplier.findByPk(supplier_id, { transaction });
        await supplier.increment("balance", { by: amount, transaction });

        await transaction.commit();
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getEntriesBySupplier = async (req, res) => {
    const { supplierId } = req.params;
    try {
        const data = await MaterialEntry.findAll({
            where: { supplier_id: supplierId },
            include: [
                { model: MaterialEntryField, as: "fields" },
                { model: db.Product, as: "product" },
                { model: db.Office, as: "office" },
            ],
            order: [["date", "DESC"]],
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateMaterialEntry = async (req, res) => {
    const { id } = req.params;
    const { date, product_id, office_id, units, amount, fields } = req.body;
    const transaction = await sequelize.transaction();

    try {
        const entry = await MaterialEntry.findByPk(id, { transaction });
        if (!entry) throw new Error("Entry not found");

        // 1. REVERSE OLD STOCK & BALANCE
        const oldStock = await ProductStock.findOne({
            where: { product_id: entry.product_id, office_id: entry.office_id },
            transaction
        });
        if (oldStock) {
            await oldStock.decrement("quantity", { by: entry.units, transaction });
        }

        const oldSupplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        if (oldSupplier) {
            await oldSupplier.decrement("balance", { by: entry.amount, transaction });
        }

        // 2. UPDATE ENTRY
        await entry.update({ date, product_id, office_id, units, amount }, { transaction });

        // 3. UPDATE FIELDS
        if (fields && typeof fields === "object") {
            await MaterialEntryField.destroy({ where: { entry_id: id }, transaction });
            const fieldEntries = Object.entries(fields).map(([name, value]) => ({
                entry_id: id,
                field_name: name,
                field_value: value,
            }));
            await MaterialEntryField.bulkCreate(fieldEntries, { transaction });
        }

        // 4. APPLY NEW STOCK & BALANCE
        const [newStock] = await ProductStock.findOrCreate({
            where: { product_id, office_id },
            defaults: { quantity: 0 },
            transaction,
        });
        await newStock.increment("quantity", { by: units, transaction });

        const newSupplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        await newSupplier.increment("balance", { by: amount, transaction });

        await transaction.commit();
        res.json({ success: true, data: entry });
    } catch (err) {
        if (transaction) await transaction.rollback();
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
            transaction
        });
        if (stock) {
            await stock.decrement("quantity", { by: entry.units, transaction });
        }

        const supplier = await MaterialSupplier.findByPk(entry.supplier_id, { transaction });
        if (supplier) {
            await supplier.decrement("balance", { by: entry.amount, transaction });
        }

        // 2. DELETE
        await entry.destroy({ transaction });

        await transaction.commit();
        res.json({ success: true, message: "Entry deleted" });
    } catch (err) {
        if (transaction) await transaction.rollback();
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
        const bank = await BankTable.findByPk(bank_id, { transaction });
        if (!bank) throw new Error("Bank not found");
        if (bank.amount < amount) throw new Error("Insufficient bank balance");

        const supplier = await MaterialSupplier.findByPk(supplier_id, { transaction });
        if (!supplier) throw new Error("Supplier not found");

        // 1. Create Statement
        const statement = await MaterialStatement.create(
            { supplier_id, bank_id, amount, payment_mode, description },
            { transaction }
        );

        // 2. Deduct Bank Amount
        await bank.decrement("amount", { by: amount, transaction });

        // 3. Deduct Supplier Balance
        await supplier.decrement("balance", { by: amount, transaction });

        await transaction.commit();
        res.status(201).json({ success: true, data: statement });
    } catch (err) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getStatementsBySupplier = async (req, res) => {
    const { supplierId } = req.params;
    try {
        const data = await MaterialStatement.findAll({
            where: { supplier_id: supplierId },
            include: [{ model: BankTable, as: "bank" }],
            order: [["createdAt", "DESC"]],
        });
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

        // 1. REVERSE OLD BANK & SUPPLIER BALANCE
        const oldBank = await BankTable.findByPk(statement.bank_id, { transaction });
        if (oldBank) {
            await oldBank.increment("amount", { by: statement.amount, transaction });
        }

        const oldSupplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        if (oldSupplier) {
            await oldSupplier.increment("balance", { by: statement.amount, transaction });
        }

        // 2. UPDATE STATEMENT
        await statement.update({ bank_id, amount, payment_mode, description }, { transaction });

        // 3. APPLY NEW BANK & SUPPLIER BALANCE
        const newBank = await BankTable.findByPk(bank_id, { transaction });
        if (!newBank) throw new Error("Bank not found");
        if (newBank.amount < amount) throw new Error("Insufficient bank balance");

        await newBank.decrement("amount", { by: amount, transaction });

        const newSupplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        await newSupplier.decrement("balance", { by: amount, transaction });

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

        // 1. REVERSE BANK & SUPPLIER BALANCE
        const bank = await BankTable.findByPk(statement.bank_id, { transaction });
        if (bank) {
            await bank.increment("amount", { by: statement.amount, transaction });
        }

        const supplier = await MaterialSupplier.findByPk(statement.supplier_id, { transaction });
        if (supplier) {
            await supplier.increment("balance", { by: statement.amount, transaction });
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
