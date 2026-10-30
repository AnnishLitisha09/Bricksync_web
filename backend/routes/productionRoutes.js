"use strict";

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
    createProduction,
    getProductionHistory,
    getProductionById,
    updateProduction,
    deleteProduction,
    restoreProduction,
    getTodayProduction,
    getProductionRecipes,
    getProductionRecipeById,
    getRecipeEstimate,
    upsertProductionRecipe,
    deleteProductionRecipe
} = require("../controllers/productionController");

router.use(verifyToken);

// Production Mix Recipes & BOM Routes
router.get("/recipes/estimate", role(1, 2), getRecipeEstimate);
router.get("/recipes", role(1, 2), getProductionRecipes);
router.get("/recipes/:id", role(1, 2), getProductionRecipeById);
router.post("/recipes", role(1, 2), upsertProductionRecipe);
router.delete("/recipes/:id", role(1), deleteProductionRecipe);

// Production Logging & History Routes
router.post("/", role(1, 2), createProduction);
router.get("/history", role(1, 2), getProductionHistory);
router.get("/today-production", role(1, 2), getTodayProduction);
router.get("/:id", role(1, 2), getProductionById);

// Admin-Only Adjustments
router.put("/:id", role(1), updateProduction);
router.delete("/:id", role(1), deleteProduction);
router.patch("/:id/restore", role(1), restoreProduction);

module.exports = router;
