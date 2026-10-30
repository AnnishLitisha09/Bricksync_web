const express = require("express");
const {
  createFuelStatement,
  getAllFuelStatements,
  getFuelStatementById,
  deleteFuelStatement,
} = require("../controllers/fuelStatementController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

// Strictly Admin Only (Role 1) - Protected Fuel Statements & Financial Settlements
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.post("/", createFuelStatement);
router.get("/", getAllFuelStatements);
router.get("/:id", getFuelStatementById);
router.delete("/:id", deleteFuelStatement);

module.exports = router;
