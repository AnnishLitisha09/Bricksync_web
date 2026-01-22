const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createBunkStatement,
  getAllBunkStatements,
  filterBunkStatements,
  payToBunk,
} = require("../controllers/bunkStatementController");

router.use(authMiddleware);

// Fuel add / payment
router.post("/", createBunkStatement);

// Direct pay from bunk
router.post("/pay", payToBunk);

// Get statements
router.get("/", getAllBunkStatements);
router.get("/filter", filterBunkStatements);

module.exports = router;
