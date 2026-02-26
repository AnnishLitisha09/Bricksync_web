const { CustomerStatement, Customer, BankTable, sequelize } = require("../models");

// Create a Statement
exports.createStatement = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { cus_id, bank_type, bank_id, amount, description, date } = req.body;

        const newStatement = await CustomerStatement.create({
            cus_id,
            bank_type,
            bank_id: bank_id || null,
            amount,
            description,
            date: date || null,
        }, { transaction });

        // 1. Update Customer Balance (Decrement - they paid)
        const customer = await Customer.findByPk(cus_id, { transaction });
        if (customer) {
            await customer.decrement("balance", { by: amount, transaction });
        }

        // 2. Update Bank Balance (Decrement - we reduce bank balance? No, we add to bank balance if we receive money? Wait.)
        // Customer paying us means our bank balance INCREASES.
        // But if we are paying a supplier (MaterialStatement), it decreases.
        // For CustomerStatement, money is coming IN.
        if (bank_id) {
            const bank = await BankTable.findByPk(bank_id, { transaction });
            if (bank) {
                await bank.increment("amount", { by: amount, transaction });
            }
        }

        await transaction.commit();
        return res.status(201).json({ message: "Statement created successfully", data: newStatement });
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating statement:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get all Statements
exports.getAllStatements = async (req, res) => {
    try {
        const statements = await CustomerStatement.findAll({
            include: [{ model: Customer, as: "customer" }],
            order: [["created_at", "DESC"]],
        });
        return res.status(200).json({ data: statements });
    } catch (error) {
        console.error("Error fetching statements:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get statements by Customer
exports.getStatementsByCustomer = async (req, res) => {
    try {
        const { cusId } = req.params;
        const statements = await CustomerStatement.findAll({
            where: { cus_id: cusId },
            include: [{ model: Customer, as: "customer" }],
            order: [["created_at", "DESC"]],
        });
        return res.status(200).json({ data: statements });
    } catch (error) {
        console.error("Error fetching statements for customer:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update a Statement
exports.updateStatement = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { cus_id, bank_type, bank_id, amount, description, date } = req.body;

        const statement = await CustomerStatement.findByPk(id);
        if (!statement) {
            await transaction.rollback();
            return res.status(404).json({ message: "Statement not found" });
        }

        // --- 1. Synchronize Customer Balance ---
        const amountDiff = Number(amount) - Number(statement.amount);
        if (amountDiff !== 0) {
            const customer = await Customer.findByPk(statement.cus_id, { transaction });
            if (customer) {
                // If amount increased, decrement more from balance (customer paid more)
                await customer.decrement("balance", { by: amountDiff, transaction });
            }
        }

        // --- 2. Synchronize Bank Balance ---
        if (statement.bank_id !== bank_id) {
            // Restore old bank
            if (statement.bank_id) {
                const oldBank = await BankTable.findByPk(statement.bank_id, { transaction });
                if (oldBank) await oldBank.decrement("amount", { by: statement.amount, transaction });
            }
            // Add to new bank
            if (bank_id) {
                const newBank = await BankTable.findByPk(bank_id, { transaction });
                if (newBank) await newBank.increment("amount", { by: amount, transaction });
            }
        } else if (bank_id && amountDiff !== 0) {
            const bank = await BankTable.findByPk(bank_id, { transaction });
            if (bank) await bank.increment("amount", { by: amountDiff, transaction });
        }

        await statement.update({
            cus_id,
            bank_type,
            bank_id: bank_id || null,
            amount,
            description,
            date: date || null
        }, { transaction });

        await transaction.commit();
        return res.status(200).json({ message: "Statement updated successfully", data: statement });
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating statement:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete a Statement
exports.deleteStatement = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const statement = await CustomerStatement.findByPk(id);
        if (!statement) {
            await transaction.rollback();
            return res.status(404).json({ message: "Statement not found" });
        }

        // 1. Restore Customer Balance (Increment - they "unpaid")
        const customer = await Customer.findByPk(statement.cus_id, { transaction });
        if (customer) {
            await customer.increment("balance", { by: statement.amount, transaction });
        }

        // 2. Restore Bank Balance (Decrement - money is gone)
        if (statement.bank_id) {
            const bank = await BankTable.findByPk(statement.bank_id, { transaction });
            if (bank) {
                await bank.decrement("amount", { by: statement.amount, transaction });
            }
        }

        await statement.destroy({ transaction });
        await transaction.commit();
        return res.status(200).json({ message: "Statement deleted successfully" });
    } catch (error) {
        await transaction.rollback();
        console.error("Error deleting statement:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
