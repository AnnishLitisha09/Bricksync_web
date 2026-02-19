const { ProductionLog, ProductStock, sequelize } = require("./models");

(async () => {
    const t = await sequelize.transaction();
    try {
        const payload = {
            office_id: 1,
            product_id: 1, // 6 Inch Block
            unit_produced: 10,
            cement_used: 2,
            cement_product_id: 6, // dalamia
            production_date: "2026-02-19",
            employee_ids: []
        };

        console.log("Simulating with payload:", payload);

        const { office_id, product_id, unit_produced, cement_used, cement_product_id, production_date } = payload;

        const log = await ProductionLog.create(
            { office_id, product_id, unit_produced, cement_used, cement_product_id, production_date },
            { transaction: t }
        );
        console.log("Log created, cement_product_id in log:", log.cement_product_id);

        if (cement_used && cement_product_id) {
            const cementStock = await ProductStock.findOne({
                where: { office_id, product_id: cement_product_id },
                transaction: t,
            });

            if (cementStock) {
                console.log("Found cement stock. Current qty:", cementStock.quantity);
                const oldQty = parseFloat(cementStock.quantity);
                const used = parseFloat(cement_used);
                cementStock.quantity = oldQty - used;
                console.log(`Calculated new qty: ${oldQty} - ${used} = ${cementStock.quantity}`);
                await cementStock.save({ transaction: t });
                console.log("Cement stock saved.");
            } else {
                console.log("Cement stock NOT found for office", office_id, "product", cement_product_id);
            }
        }

        await t.commit();
        console.log("Transaction committed!");

        // Verify
        const updatedStock = await ProductStock.findOne({
            where: { office_id: 1, product_id: 6 }
        });
        console.log("Verified stock quantity in DB:", updatedStock.quantity);

        process.exit(0);
    } catch (err) {
        await t.rollback();
        console.error("Simulation failed:", err);
        process.exit(1);
    }
})();
