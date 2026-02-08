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

router.use(authMiddleware);

router.post("/", createBank);
router.get("/", getAllBanks);
router.get("/:id", getBankById);
router.put("/:id", updateBank);
router.delete("/:id", deleteBank);

module.exports = router;
