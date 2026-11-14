"use strict";

const express = require("express");
const router = express.Router();
const cursorController = require("../controllers/cursorController");
const authMiddleware = require("../middleware/authMiddleware");
const { ensureCursorAndBranchTables } = require("../utils/schemaSync");
const { sequelize } = require("../models");

// Self-healing middleware: ensures database tables exist before query execution
let schemaInitialized = false;
router.use(async (req, res, next) => {
  if (!schemaInitialized) {
    try {
      await ensureCursorAndBranchTables(sequelize);
      schemaInitialized = true;
    } catch (err) {
      console.warn("Schema initialization check warning in cursorRoutes:", err.message);
    }
  }
  next();
});

router.use(authMiddleware);

// Cursors
router.get("/", cursorController.getAllCursors);
router.get("/loaded-materials", cursorController.getLoadedMaterials);
router.get("/loads", cursorController.getAllLoads);
router.get("/branch-deliveries/:officeId", cursorController.getBranchDeliveries);
router.post("/branch-delivery", cursorController.createBranchDelivery);
router.post("/branch-deliveries/:id/add-to-stock", cursorController.addBranchDeliveryToStock);

router.get("/:id", cursorController.getCursorById);
router.post("/", cursorController.createCursor);
router.put("/:id", cursorController.updateCursor);
router.delete("/:id", cursorController.deleteCursor);

// Products under Cursor
router.post("/:id/products", cursorController.addProduct);
router.delete("/products/:productId", cursorController.deleteProduct);

// Loads under Cursor
router.post("/:id/loads", cursorController.createLoad);
router.put("/loads/:loadId/status", cursorController.updateLoadStatus);
router.delete("/loads/:loadId", cursorController.deleteLoad);

// Payments under Cursor
router.post("/:id/payments", cursorController.createPayment);
router.get("/:id/payments", cursorController.getCursorPayments);
router.delete("/payments/:paymentId", cursorController.deletePayment);

module.exports = router;
