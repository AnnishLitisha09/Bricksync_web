const { Invoice, ProductStock, User, sequelize } = require("../models");
const { sendWhatsAppMessage } = require("../utils/whatsappService");
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
            officeId,
            notifyDriver,
            driverId
        } = req.body;

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
            materialId,
            officeId,
            notifyDriver,
            driverId,
            isActive: true
        }, { transaction });

        await transaction.commit();

        // 3. Post-Creation Notification (Async)
        if (newInvoice.notifyDriver && newInvoice.driverId) {
            // Trigger notification but don't wait for it to respond to the request
            exports.sendWhatsAppNotification({ params: { id: newInvoice.id } }, {
                status: () => ({ json: () => { } }),
                json: () => { }
            }).catch(e => console.error("Auto-notification failed:", e));
        }

        res.status(201).json({ success: true, message: "Invoice created successfully", data: newInvoice });
    } catch (error) {
        if (transaction) await transaction.rollback();
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

exports.getInvoiceStatus = async (req, res) => {
    try {
        // Read from query param: GET /invoices/public/status?filename=Invoice_00037-2526.pdf
        const filename = req.query.filename;
        if (!filename) {
            return res.status(400).json({ success: false, message: "filename query param is required" });
        }
        console.log("[getInvoiceStatus] Looking up filename:", filename);

        let invoice = null;

        // 1. Try exact filename match
        invoice = await Invoice.findOne({ where: { filename } });

        // 2. Fallback: pdfPath LIKE '%filename'
        if (!invoice) {
            invoice = await Invoice.findOne({
                where: { pdfPath: { [Op.like]: `%${filename}` } }
            });
        }

        // 3. Fallback: parse invoiceId from filename
        // e.g. "Invoice_00037-2526.pdf" → strip prefix/suffix → "00037-2526" → replace last -NNNN with /NNNN → "00037/2526"
        if (!invoice) {
            try {
                const base = filename.replace(/^Invoice_/, '').replace(/\.pdf$/i, '');
                // Replace the last dash+4digits with /4digits (the year suffix)
                const invoiceId = base.replace(/-(\d{4})$/, '/$1');
                console.log("[getInvoiceStatus] Trying invoiceId:", invoiceId);
                invoice = await Invoice.findOne({
                    where: { invoiceId },
                    order: [['id', 'DESC']]
                });
            } catch (parseErr) {
                console.warn("[getInvoiceStatus] Could not parse invoiceId from filename:", parseErr.message);
            }
        }

        if (!invoice) {
            console.log("[getInvoiceStatus] Not found for filename:", filename);
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        let isActuallyActive = invoice.isActive;

        // Check 3-hour expiry if notifiedAt is set
        if (isActuallyActive && invoice.notifiedAt) {
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
            if (new Date(invoice.notifiedAt) < threeHoursAgo) {
                console.log("[getInvoiceStatus] Invoice expired (3 hours passed since notification)");
                isActuallyActive = false;

                // Optionally update DB to persist this deactivation
                invoice.update({ isActive: false }).catch(e => { });
            }
        }

        console.log("[getInvoiceStatus] Found invoice id:", invoice.id, "isActive:", isActuallyActive);
        res.json({
            success: true,
            isActive: isActuallyActive,
            filename: invoice.filename,
            pdfPath: invoice.pdfPath
        });
    } catch (error) {
        console.error("Get Invoice Status Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.sendWhatsAppNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByPk(id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        if (!invoice.driverId) {
            return res.status(400).json({ success: false, message: "No driver associated with this invoice" });
        }

        const driver = await User.findByPk(invoice.driverId);
        if (!driver || !driver.phoneNumber) {
            return res.status(404).json({ success: false, message: "Driver or driver phone number not found" });
        }

        // Use the requested public URL format
        const pdfLink = `https://www.aswath.online/view/invoice/${invoice.filename}`;

        const message = `🔔 *New Invoice Assigned*\n\nHello ${driver.name},\nAn invoice has been generated for vehicle *${invoice.vehicleNumber}*.\n\n📄 *View Invoice:* ${pdfLink}\n\n_This link will expire in 3 hours._\n\n_Generated by Bricksync_`;

        const success = await sendWhatsAppMessage(driver.phoneNumber, message);

        if (success) {
            // Update notifiedAt and ensure isActive is true when sending
            await invoice.update({
                notifiedAt: new Date(),
                isActive: true
            });
            res.json({ success: true, message: "WhatsApp notification sent to driver" });
        } else {
            res.status(500).json({ success: false, message: "Failed to send WhatsApp message" });
        }
    } catch (error) {
        console.error("WhatsApp Notification Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
};
