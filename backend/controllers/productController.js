const { Product, ProductStock } = require("../models");

/* 🔹 Get All Products */
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { is_deleted: false },
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Get Product by ID */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { product_id: req.params.id, is_deleted: false },
        });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Create Product */
exports.createProduct = async (req, res) => {
    try {
        const { product_name, category, description, office_id, quantity } = req.body;
        const image_url = req.file ? `/images/${req.file.filename}` : null;

        const product = await Product.create({
            product_name,
            category,
            description,
            image_url,
        });


        // If office and quantity provided, create initial stock
        if (office_id && quantity) {
            await ProductStock.create({
                product_id: product.product_id,
                office_id: office_id,
                quantity: quantity,
            });
        }

        res.status(201).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Update Product */
exports.updateProduct = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image_url = `/images/${req.file.filename}`;
        }


        const [updated] = await Product.update(updateData, {
            where: { product_id: req.params.id, is_deleted: false },
        });
        if (!updated) return res.status(404).json({ message: "Product not found" });
        const product = await Product.findByPk(req.params.id);
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* 🔹 Soft Delete Product */
exports.deleteProduct = async (req, res) => {
    try {
        const [updated] = await Product.update(
            { is_deleted: true, deleted_at: new Date() },
            { where: { product_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product soft deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* 🔹 Restore Product */
exports.restoreProduct = async (req, res) => {
    try {
        const [updated] = await Product.update(
            { is_deleted: false, deleted_at: null },
            { where: { product_id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product restored" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
