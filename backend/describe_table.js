const { sequelize } = require("./models");

(async () => {
    try {
        const [results] = await sequelize.query("DESCRIBE production_log");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
