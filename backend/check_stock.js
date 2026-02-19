const { ProductStock, Product, Office } = require("./models");

(async () => {
    try {
        const stock = await ProductStock.findAll({
            include: [
                { model: Product, as: 'product', attributes: ['product_id', 'product_name', 'category'] },
                { model: Office, as: 'office', attributes: ['office_id', 'office_name'] }
            ],
            where: { is_deleted: false }
        });
        console.log(JSON.stringify(stock, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
