const { ProductionLog, Product, Office } = require("./models");

(async () => {
    try {
        const logs = await ProductionLog.findAll({
            include: [
                { model: Product, as: 'product', attributes: ['product_id', 'product_name'] },
                { model: Product, as: 'cementProduct', attributes: ['product_id', 'product_name'] },
                { model: Office, as: 'office', attributes: ['office_id', 'office_name'] }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });
        console.log(JSON.stringify(logs, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
