const { Product } = require("./models");

(async () => {
    try {
        const products = await Product.findAll({
            attributes: ['product_id', 'product_name', 'category']
        });
        console.log(JSON.stringify(products, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
