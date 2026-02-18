const { Office, ProductionLog, ProductStock } = require("../models");
const { Op } = require("sequelize");

/* 🔹 Get All Offices */
exports.getAllOffices = async (req, res) => {
    try {
        const offices = await Office.findAll({
            where: { is_deleted: false },
        });
        res.json(offices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Get Office by ID */
exports.getOfficeById = async (req, res) => {
    try {
        const office = await Office.findOne({
            where: { office_id: req.params.id, is_deleted: false },
        });
        if (!office) return res.status(404).json({ message: "Office not found" });
        res.json(office);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Create Office */
exports.createOffice = async (req, res) => {
    try {
        const { office_name, location } = req.body;
        const office = await Office.create({ office_name, location });
        res.status(201).json(office);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Update Office */
exports.updateOffice = async (req, res) => {
    try {
        const [updated] = await Office.update(req.body, {
            where: { office_id: req.params.id, is_deleted: false },
        });
        if (!updated) return res.status(404).json({ message: "Office not found" });
        const office = await Office.findByPk(req.params.id);
        res.json(office);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Soft Delete Office */
exports.deleteOffice = async (req, res) => {
    try {
        const [updated] = await Office.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { office_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Office not found" });
        res.json({ message: "Office soft deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Restore Office */
exports.restoreOffice = async (req, res) => {
    try {
        const [updated] = await Office.update(
            { is_deleted: false, deleted_at: null },
            { where: { office_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Office not found" });
        res.json({ message: "Office restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Office Summary (Dashboard) */
exports.getOfficeSummary = async (req, res) => {
    try {
        const summary = await Office.findAll({
            where: { is_deleted: false },
            include: [
                {
                    model: ProductStock,
                    as: "stocks",
                    attributes: ["quantity"],
                },
            ],
        });
        // Further aggregation can be done here if specific format is required
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
