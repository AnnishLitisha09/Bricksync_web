const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createBunk,
  getAllBunks,
  getBunkById,
  updateBunk,
  deleteBunk,
} = require("../controllers/bunkController");

// 🔐 Protect all bunk routes
router.use(authMiddleware);

// CRUD
router.post("/", createBunk);
router.get("/", getAllBunks);
router.get("/:id", getBunkById);
router.put("/:id", updateBunk);
router.delete("/:id", deleteBunk);

module.exports = router;
