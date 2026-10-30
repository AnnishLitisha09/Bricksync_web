const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createBunkStatement,
  getAllBunkStatements,
  filterBunkStatements,
  payToBunk,
} = require("../controllers/bunkStatementController");

// Strictly Admin Only (Role 1) - Protected Bunk Statements & Payments
router.use(authMiddleware);
router.use(roleMiddleware(1));

// Fuel add / payment
router.post("/", createBunkStatement);

// Direct pay from bunk
router.post("/pay", payToBunk);

// Get statements
router.get("/", getAllBunkStatements);
router.get("/filter", filterBunkStatements);

module.exports = router;
