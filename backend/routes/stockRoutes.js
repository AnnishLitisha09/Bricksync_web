const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getAllStock,
    manualUpdateStock,
    deleteStock,
    restoreStock,
    getLowStock,
    getCementUsage
} = require("../controllers/stockController");

router.get("/", verifyToken, getAllStock);
router.get("/low-stock", verifyToken, getLowStock); // Dashboard stat
router.get("/cement-usage", verifyToken, getCementUsage); // Dashboard stat
router.put("/manual-update", verifyToken, manualUpdateStock);
router.delete("/:id", verifyToken, deleteStock);
router.patch("/:id/restore", verifyToken, restoreStock);

module.exports = router;
