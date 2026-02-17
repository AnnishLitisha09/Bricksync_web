const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  createTransaction,
  getTransactions,
  deleteTransaction,
} = require("../controllers/walletController");

router.use(auth);

router.post("/transaction", createTransaction);
router.get("/transaction", getTransactions);
router.delete("/transaction/:id", deleteTransaction);

module.exports = router;
