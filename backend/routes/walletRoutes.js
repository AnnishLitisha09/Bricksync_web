const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const {
  createTransaction,
  getTransactions,
  deleteTransaction,
  getSystemTransactions,
} = require("../controllers/walletController");

// Strictly Admin Only (Role 1) - Protected Financial Wallet Transactions
router.use(auth);
router.use(role(1));

router.post("/transaction", createTransaction);
router.get("/transaction", getTransactions);
router.get("/all-transactions", getSystemTransactions);
router.delete("/transaction/:id", deleteTransaction);

module.exports = router;
