const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
    getAllStock,
    manualUpdateStock,
    updateStockById,
    deleteStock,
    restoreStock,
    getLowStock,
    getCementUsage
} = require("../controllers/stockController");

router.get("/", verifyToken, role(1, 2), getAllStock);
router.get("/low-stock", verifyToken, role(1, 2), getLowStock);
router.get("/cement-usage", verifyToken, role(1, 2), getCementUsage);

// Admin-Only Stock Manipulations
router.put("/manual-update", verifyToken, role(1), manualUpdateStock);
router.put("/:id", verifyToken, role(1), updateStockById);
router.delete("/:id", verifyToken, role(1), deleteStock);
router.patch("/:id/restore", verifyToken, role(1), restoreStock);

module.exports = router;
