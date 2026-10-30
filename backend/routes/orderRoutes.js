"use strict";

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Admin-Only Order Manipulation
router.post("/", roleMiddleware(1), orderController.createOrder);
router.put("/:id", roleMiddleware(1), orderController.updateOrder);
router.delete("/:id", roleMiddleware(1), orderController.deleteOrder);
router.post("/bulk-import", roleMiddleware(1), orderController.bulkImportOrders);

// Order Retrieval (Admin, Driver, Customer)
router.get("/", roleMiddleware(1, 2, 3), orderController.getAllOrders);
router.get("/:id", roleMiddleware(1, 2, 3), orderController.getOrderById);

module.exports = router;
