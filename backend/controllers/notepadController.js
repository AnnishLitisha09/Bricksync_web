const { Notepad } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

exports.saveNotepad = async (req, res) => {
    try {
        const { formData, pdfPath } = req.body;

        // Save to DB
        const notepad = await Notepad.create({
            verifiedId: formData.verifiedId.value,
            title: formData.title.value,
            address: formData.address.value,
            phone: formData.phone.value,
            email: formData.email.value,
            website: formData.website.value,
            notes: formData.notes.value,
            companySignature: formData.companySignature.value,
            pdfPath: pdfPath || null,
            filename: req.body.filename || null
        });

        res.status(200).json({ success: true, message: "Notepad saved successfully", data: notepad });
    } catch (error) {
        console.error("Save Notepad Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No PDF file uploaded" });
        }
        res.status(200).json({
            success: true,
            message: "PDF uploaded successfully",
            filename: req.file.filename,
            path: `/pdfs/${req.file.filename}`
        });
    } catch (error) {
        console.error("Upload PDF Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.getAllNotepads = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const offset = (page - 1) * limit;

        const whereCondition = search ? {
            [Op.or]: [
                { verifiedId: { [Op.like]: `%${search}%` } },
                { title: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { filename: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await Notepad.findAndCountAll({
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
        console.error("Get Notepads Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

exports.getNotepadStats = async (req, res) => {
    try {
        const count = await Notepad.count();
        res.json({ success: true, totalGenerated: count });
    } catch (error) {
        console.error("Get Stats Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
