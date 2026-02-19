const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct
} = require("../controllers/productController");

router.get("/", verifyToken, getAllProducts);
router.get("/:id", verifyToken, getProductById);
router.post("/", verifyToken, upload.single("image"), createProduct);
router.put("/:id", verifyToken, upload.single("image"), updateProduct);
router.delete("/:id", verifyToken, deleteProduct);
router.patch("/:id/restore", verifyToken, restoreProduct);


module.exports = router;
