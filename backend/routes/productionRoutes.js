const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    createProduction,
    getProductionHistory,
    getProductionById,
    updateProduction,
    deleteProduction,
    restoreProduction,
    getTodayProduction
} = require("../controllers/productionController");

router.post("/", verifyToken, createProduction);
router.get("/history", verifyToken, getProductionHistory);
router.get("/today-production", verifyToken, getTodayProduction); // Dashboard stat
router.get("/:id", verifyToken, getProductionById);
router.put("/:id", verifyToken, updateProduction);
router.delete("/:id", verifyToken, deleteProduction);
router.patch("/:id/restore", verifyToken, restoreProduction);

module.exports = router;
