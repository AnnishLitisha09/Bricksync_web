"use strict";

const express = require("express");
const router = express.Router();

const {
  createServiceShop,
  getAllServiceShops,
  getServiceShopById,
  updateServiceShop,
  deleteServiceShop,
} = require("../controllers/serviceShopController");
const authMiddleware = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Admin-Only Workshop Configurations
router.post("/", role(1), createServiceShop);
router.put("/:id", role(1), updateServiceShop);
router.delete("/:id", role(1), deleteServiceShop);

// Lookup (Admin, Driver)
router.get("/", role(1, 2), getAllServiceShops);
router.get("/:id", role(1, 2), getServiceShopById);

module.exports = router;
