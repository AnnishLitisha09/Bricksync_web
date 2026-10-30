require("dotenv").config();

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || "25", 10),
  min: parseInt(process.env.DB_POOL_MIN || "2", 10),
  acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
  idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
};

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    pool: poolConfig,
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "database_test",
    host: process.env.DB_HOST,
    dialect: "mysql",
    pool: poolConfig,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: "database_production",
    host: process.env.DB_HOST,
    dialect: "mysql",
    pool: poolConfig,
  },
};
