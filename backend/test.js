const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.PORT,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection successful to Aiven MySQL!");
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
})();
