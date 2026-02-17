const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = require("../config/config.js").development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const db = {};

/* ================= LOAD MODELS ================= */

fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js")
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

/* ================= RUN MODEL ASSOCIATIONS ================= */

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

/* ================= VEHICLE RELATIONS ================= */

if (db.Vehicle && db.VehicleService) {
  db.Vehicle.hasMany(db.VehicleService, {
    foreignKey: "vehicleId",
    as: "services",
  });

  db.VehicleService.belongsTo(db.Vehicle, {
    foreignKey: "vehicleId",
    as: "vehicle",
  });
}

if (db.Vehicle && db.VehicleFuel) {
  db.Vehicle.hasMany(db.VehicleFuel, {
    foreignKey: "vehicleId",
    as: "vehicleFuels",
  });

  db.VehicleFuel.belongsTo(db.Vehicle, {
    foreignKey: "vehicleId",
    as: "vehicle",
  });
}

/* ================= SERVICE SHOP ================= */

if (db.ServiceShop && db.VehicleService) {
  db.ServiceShop.hasMany(db.VehicleService, {
    foreignKey: "serviceShopId",
    as: "services",
  });

  db.VehicleService.belongsTo(db.ServiceShop, {
    foreignKey: "serviceShopId",
    as: "serviceShop",
  });
}

/* ================= BUNK RELATIONS ================= */

if (db.Bunk && db.VehicleFuel) {
  db.Bunk.hasMany(db.VehicleFuel, {
    foreignKey: "bunkId",
    as: "vehicleFuels",
  });

  db.VehicleFuel.belongsTo(db.Bunk, {
    foreignKey: "bunkId",
    as: "fuelBunk",
  });
}

if (db.Bunk && db.BunkStatement) {
  db.Bunk.hasMany(db.BunkStatement, {
    foreignKey: "bunkId",
    as: "bunkStatements",
  });

  db.BunkStatement.belongsTo(db.Bunk, {
    foreignKey: "bunkId",
    as: "statementBunk",
  });
}

if (db.Bunk && db.FuelStatement) {
  db.Bunk.hasMany(db.FuelStatement, {
    foreignKey: "bunk_id",
    as: "fuelStatements",
  });

  db.FuelStatement.belongsTo(db.Bunk, {
    foreignKey: "bunk_id",
    as: "paymentBunk",
  });
}

/* ================= BANK RELATIONS ================= */

if (db.BankTable && db.FuelStatement) {
  db.BankTable.hasMany(db.FuelStatement, {
    foreignKey: "bank_id",
    as: "fuelStatements",
  });

  db.FuelStatement.belongsTo(db.BankTable, {
    foreignKey: "bank_id",
    as: "fuelBank",
  });
}

/* ================= EXPORT ================= */

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
