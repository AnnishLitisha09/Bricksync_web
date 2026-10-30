"use strict";

const express = require("express");
const router = express.Router();
const customerStatementController = require("../controllers/customerStatementController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Admin-Only Statement & Ledger Adjustments
router.post("/", roleMiddleware(1), customerStatementController.createStatement);
router.put("/:id", roleMiddleware(1), customerStatementController.updateStatement);
router.delete("/:id", roleMiddleware(1), customerStatementController.deleteStatement);

// Viewing
router.get("/", roleMiddleware(1), customerStatementController.getAllStatements);
router.get("/customer/:cusId", roleMiddleware(1, 3), customerStatementController.getStatementsByCustomer);

module.exports = router;
