const express = require("express");
const {
  createFuelStatement,
  getAllFuelStatements,
  getFuelStatementById,
  deleteFuelStatement,
} = require("../controllers/fuelStatementController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.post("/", createFuelStatement);
router.get("/", getAllFuelStatements);
router.get("/:id", getFuelStatementById);
router.delete("/:id", deleteFuelStatement);

module.exports = router;
