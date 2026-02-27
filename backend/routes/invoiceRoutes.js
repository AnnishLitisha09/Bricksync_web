const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");

router.post("/create", invoiceController.createInvoice);
router.get("/", invoiceController.getAllInvoices);
router.patch("/status/:id", invoiceController.toggleInvoiceStatus);
router.patch("/pdf/:id", invoiceController.updatePdfPath);
router.get("/public/status", invoiceController.getInvoiceStatus);
router.post("/notify-driver/:id", invoiceController.sendWhatsAppNotification);

module.exports = router;
