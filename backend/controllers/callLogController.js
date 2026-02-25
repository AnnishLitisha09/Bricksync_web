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

// Get all Call Logs
exports.getAllCallLogs = async (req, res) => {
    try {
        const logs = await CallLog.findAll({
            include: [{ model: Customer, as: "customer" }],
            order: [["created_at", "DESC"]],
        });
        return res.status(200).json({ data: logs });
    } catch (error) {
        console.error("Error fetching call logs:", error);
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
