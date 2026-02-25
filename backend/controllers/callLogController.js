const { CallLog, Customer } = require("../models");
const { Op } = require("sequelize");

// Create a Call Log
exports.createCallLog = async (req, res) => {
    try {
        const { cus_id, date, next_call_date, description } = req.body;
        const newCallLog = await CallLog.create({
            cus_id,
            date,
            next_call_date,
            description,
        });
        return res.status(201).json({ message: "Call log created successfully", data: newCallLog });
    } catch (error) {
        console.error("Error creating call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get all Call Logs with Pagination and Search
exports.getAllCallLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {
            is_deleted: false,
        };

        const customerInclude = {
            model: Customer,
            as: "customer",
            where: search ? {
                name: {
                    [Op.like]: `%${search}%`
                }
            } : {}
        };

        const { count, rows } = await CallLog.findAndCountAll({
            where: whereClause,
            include: [customerInclude],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json({
            data: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
        });
    } catch (error) {
        console.error("Error fetching call logs:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get call logs for today (next_call_date == today)
exports.getTodayCallLogs = async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('en-CA');
        const logs = await CallLog.findAll({
            include: [{ model: Customer, as: "customer" }],
            where: {
                next_call_date: today,
                is_deleted: false,
            },
            order: [["created_at", "DESC"]],
        });
        return res.status(200).json({ data: logs });
    } catch (error) {
        console.error("Error fetching today's call logs:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get call logs by next_call_date
exports.getLogsByNextCallDate = async (req, res) => {
    try {
        const logs = await CallLog.findAll({
            include: [{ model: Customer, as: "customer" }],
            where: {
                next_call_date: {
                    [Op.ne]: null,
                },
            },
            order: [["next_call_date", "ASC"]],
        });
        return res.status(200).json({ data: logs });
    } catch (error) {
        console.error("Error fetching future call logs:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update a Call Log
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
        console.error("Error updating call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Toggle Call Status (Called/Not Called)
exports.toggleCallStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await CallLog.findByPk(id);
        if (!log) {
            return res.status(404).json({ message: "Call log not found" });
        }

        await log.update({ is_called: !log.is_called });
        return res.status(200).json({ message: "Status updated successfully", data: log });
    } catch (error) {
        console.error("Error toggling call status:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete a Call Log
exports.deleteCallLog = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await CallLog.findByPk(id);
        if (!log) {
            return res.status(404).json({ message: "Call log not found" });
        }

        await log.destroy();
        return res.status(200).json({ message: "Call log deleted successfully" });
    } catch (error) {
        console.error("Error deleting call log:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
