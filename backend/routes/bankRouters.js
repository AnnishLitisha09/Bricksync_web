const express = require("express");
const router = express.Router();
const {
  createBank,
  getAllBanks,
  getBankById,
  updateBank,
  deleteBank,
} = require("../controllers/bankController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1) - Protected Payment & Financial Asset
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.post("/", createBank);
router.get("/", getAllBanks);
router.get("/:id", getBankById);
router.put("/:id", updateBank);
router.delete("/:id", deleteBank);

module.exports = router;
