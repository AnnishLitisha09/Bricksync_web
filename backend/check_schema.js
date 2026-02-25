const { sequelize } = require("./models");
const fs = require("fs");

async function checkSchema() {
    const tables = ["employees", "orders", "products", "offices", "customer_statements", "call_logs"];
    const schema = {};

    try {
        for (const table of tables) {
            const [results] = await sequelize.query(`DESCRIBE ${table}`);
            schema[table] = results;
        }
        fs.writeFileSync("full_schema.json", JSON.stringify(schema, null, 2));
        console.log("Schema written to full_schema.json");
        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();
