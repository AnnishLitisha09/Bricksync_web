"use strict";

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createBunk,
  getAllBunks,
  getBunkById,
  updateBunk,
  deleteBunk,
} = require("../controllers/bunkController");

// 🔐 Protect all bunk routes
router.use(authMiddleware);

// Admin-Only Shop Modifications
router.post("/", role(1), createBunk);
router.put("/:id", role(1), updateBunk);
router.delete("/:id", role(1), deleteBunk);

// Viewing (Admin, Driver)
router.get("/", role(1, 2), getAllBunks);
router.get("/:id", role(1, 2), getBunkById);

module.exports = router;
