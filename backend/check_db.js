const { sequelize } = require("./models");
const fs = require("fs");

async function checkTable() {
    try {
        const [results, metadata] = await sequelize.query("DESCRIBE customers");
        fs.writeFileSync("db_structure.json", JSON.stringify(results, null, 2));
        console.log("Structure written to db_structure.json");
        process.exit(0);
    } catch (error) {
        console.error("Error describing table:", error);
        process.exit(1);
    }
}

checkTable();
