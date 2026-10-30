
require("dotenv").config();

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || "25", 10),
  min: parseInt(process.env.DB_POOL_MIN || "2", 10),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
  idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
};

const databaseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  pool: poolConfig,
};

module.exports = {
  development: databaseConfig,
  test: {
    ...databaseConfig,
    database: process.env.DB_TEST_NAME || "bricksync_test",
  },
  production: databaseConfig,
};
