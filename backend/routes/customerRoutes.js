"use strict";

const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const customerStatementController = require("../controllers/customerStatementController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Customer Management (Admin Only)
router.post("/", roleMiddleware(1), customerController.createCustomer);
router.get("/", roleMiddleware(1), customerController.getAllCustomers);
router.get("/:id", roleMiddleware(1, 3), customerController.getCustomerById);
router.put("/:id", roleMiddleware(1), customerController.updateCustomer);
router.delete("/:id", roleMiddleware(1), customerController.deleteCustomer);

router.put("/statements/:id", roleMiddleware(1), customerStatementController.updateStatement);
router.delete("/statements/:id", roleMiddleware(1), customerStatementController.deleteStatement);

router.post("/bulk-create", roleMiddleware(1), customerController.bulkCreateCustomers);

module.exports = router;
