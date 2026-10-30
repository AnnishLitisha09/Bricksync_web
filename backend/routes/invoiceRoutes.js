"use strict";

const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Public QR Verification
router.get("/public/status", invoiceController.getInvoiceStatus);

// Admin-Only Invoice Creation, History, and Management
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.post("/create", invoiceController.createInvoice);
router.get("/", invoiceController.getAllInvoices);
router.patch("/status/:id", invoiceController.toggleInvoiceStatus);
router.patch("/pdf/:id", invoiceController.updatePdfPath);

module.exports = router;
