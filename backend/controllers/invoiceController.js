const { Invoice, ProductStock, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.createInvoice = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {
            invoiceId,
            customerNumber,
            customerPhone,
            customerAddress,
            date,
            transportMode,
            vehicleNumber,
            dateOfSupply,
            deliveryPlace,
            materialName,
            hsnCode,
            unit,
            office,
            quantity,
            ratePerUnit,
            sgst,
            cgst,
            igst,
            totalAmount,
            roundOff,
            totalInWords,
            billingName,
            billingAddress,
            billingGstin,
            billingState,
            shippingName,
            shippingAddress,
            shippingGstin,
            shippingState,
            bankName,
            accountNo,
            ifscCode,
            materialId,
            officeId
        } = req.body;

        // 1. Stock Management
        if (materialId && officeId) {
            const stock = await ProductStock.findOne({
                where: { product_id: materialId, office_id: officeId },
                transaction
            });

            if (!stock) {
                throw new Error(`Stock record not found for ${materialName} at the selected office.`);
            }

            if (Number(stock.quantity) < Number(quantity)) {
                throw new Error(`Insufficient stock for ${materialName}. Available: ${stock.quantity}`);
            }

            await stock.decrement("quantity", { by: quantity, transaction });
        }

        // 2. Create Invoice
        const newInvoice = await Invoice.create({
            invoiceId,
            customerNumber,
            customerPhone,
            customerAddress,
            date,
            transportMode,
            vehicleNumber,
            dateOfSupply,
            deliveryPlace,
            materialName,
            hsnCode,
            unit,
            office,
            quantity,
            ratePerUnit,
            sgst,
            cgst,
            igst,
            totalAmount,
            roundOff,
            totalInWords,
            billingName,
            billingAddress,
            billingGstin,
            billingState,
            shippingName,
            shippingAddress,
            shippingGstin,
            shippingState,
            bankName,
            accountNo,
            ifscCode,
            isActive: true
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ success: true, message: "Invoice created successfully", data: newInvoice });
    } catch (error) {
        await transaction.rollback();
        console.error("Create Invoice Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
};

exports.getAllInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const offset = (page - 1) * limit;

        const whereCondition = search ? {
            [Op.or]: [
                { invoiceId: { [Op.like]: `%${search}%` } },
                { customerNumber: { [Op.like]: `%${search}%` } },
                { vehicleNumber: { [Op.like]: `%${search}%` } },
                { materialName: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await Invoice.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Get Invoices Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.toggleInvoiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        await invoice.update({ isActive });
        res.json({ success: true, message: `Invoice marked as ${isActive ? 'Active' : 'Inactive'}` });
    } catch (error) {
        console.error("Toggle Status Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.updatePdfPath = async (req, res) => {
    try {
        const { id } = req.params;
        const { pdfPath, filename } = req.body;

        const invoice = await Invoice.findByPk(id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        await invoice.update({ pdfPath, filename });
        res.json({ success: true, message: "PDF path updated successfully" });
    } catch (error) {
        console.error("Update PDF Path Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
