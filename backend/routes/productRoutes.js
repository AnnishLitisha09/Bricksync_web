"use strict";

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct
} = require("../controllers/productController");

router.use(verifyToken);

router.get("/", role(1, 2, 3), getAllProducts);
router.get("/:id", role(1, 2, 3), getProductById);

// Admin-Only Product Catalog Modifications
router.post("/", role(1), upload.single("image"), createProduct);
router.put("/:id", role(1), upload.single("image"), updateProduct);
router.delete("/:id", role(1), deleteProduct);
router.patch("/:id/restore", role(1), restoreProduct);

module.exports = router;
