const { CallLog, Customer } = require("../models");
const { Op } = require("sequelize");

// Fetch today's call logs
exports.getTodayCallLogs = async (req, res) => {
    try {
        const d = new Date();
        const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        console.log(`🔍 [API] Fetching pending reminders for date <= ${today}`);

        const logs = await CallLog.findAll({
            include: [{ model: Customer, as: "customer" }],
            where: {
                next_call_date: {
                    [Op.lte]: today
                },
                is_called: false,
                is_deleted: false,
            },
            order: [["next_call_date", "ASC"], ["created_at", "DESC"]],
        });

        console.log(`✅ [API] Found ${logs.length} pending reminders.`);
        return res.status(200).json({ data: logs });
    } catch (error) {
        console.error("❌ [API] Error fetching today's call logs:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Fetch call logs with pagination and search
exports.getAllCallLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const whereCondition = { is_deleted: false };

        if (search) {
            whereCondition["$customer.name$"] = { [Op.like]: `%${search}%` };
        }

        const { count, rows } = await CallLog.findAndCountAll({
            include: [{ model: Customer, as: "customer" }],
            where: whereCondition,
            limit,
            offset,
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json({
            data: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error("❌ [API] Error fetching all call logs:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Create a new call log
exports.createCallLog = async (req, res) => {
    try {
        const { cus_id, date, next_call_date, description } = req.body;
        if (!cus_id || !date) {
            return res.status(400).json({ message: "Customer ID and Date are required" });
        }

        const log = await CallLog.create({
            cus_id,
            date,
            next_call_date,
            description,
            is_called: false
        });

        return res.status(201).json({ message: "Call log created successfully", data: log });
    } catch (error) {
        console.error("❌ [API] Error creating call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update a call log
exports.updateCallLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { cus_id, date, next_call_date, description } = req.body;

        const log = await CallLog.findByPk(id);
        if (!log) {
            return res.status(404).json({ message: "Call log not found" });
        }

        await log.update({ cus_id, date, next_call_date, description });
        return res.status(200).json({ message: "Call log updated successfully", data: log });
    } catch (error) {
        console.error("❌ [API] Error updating call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Toggle Call Status (Called/Not Called)
exports.toggleCallStatus = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔄 [API] INCOMING: Toggle Status for ID: ${id}`);

        const log = await CallLog.findByPk(id);
        if (!log) {
            console.warn(`⚠️ [API] Call Log Not Found: ${id}`);
            return res.status(404).json({ message: "Call log not found" });
        }

        const updatedStatus = !log.is_called;
        await log.update({ is_called: updatedStatus });

        console.log(`✅ [API] SUCCESS: ID ${id} is now ${updatedStatus ? 'COMPLETED' : 'PENDING'}`);
        return res.status(200).json({
            message: `Status updated to ${updatedStatus ? 'Completed' : 'Pending'}`,
            data: log
        });
    } catch (error) {
        console.error("❌ [API] CRITICAL ERROR Toggling Status:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete a call log (Soft Delete)
exports.deleteCallLog = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await CallLog.findByPk(id);
        if (!log) {
            return res.status(404).json({ message: "Call log not found" });
        }

        await log.update({ is_deleted: true, deleted_at: new Date() });
        return res.status(200).json({ message: "Call log deleted successfully" });
    } catch (error) {
        console.error("❌ [API] Error deleting call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Fetch calls by next date (Internal/Specific use)
exports.getLogsByNextCallDate = async (req, res) => {
    try {
        const { date } = req.query;
        const logs = await CallLog.findAll({
            include: [{ model: Customer, as: "customer" }],
            where: {
                next_call_date: date,
                is_deleted: false,
            },
        });
        return res.status(200).json({ data: logs });
    } catch (error) {
        console.error("❌ [API] Error fetching next calls:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
