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

// Load all models in this directory
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js")
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Vehicle -> VehicleService
if (db.VehicleService) {
  db.Vehicle.hasMany(db.VehicleService, { foreignKey: "vehicleId", as: "services" });
  db.VehicleService.belongsTo(db.Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
}

// Vehicle -> VehicleFuel
if (db.VehicleFuel) {
  db.Vehicle.hasMany(db.VehicleFuel, { foreignKey: "vehicleId", as: "vehicleFuels" });
  db.VehicleFuel.belongsTo(db.Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
}

// Bunk -> VehicleFuel
if (db.Bunk && db.VehicleFuel) {
  db.Bunk.hasMany(db.VehicleFuel, { foreignKey: "bunkId", as: "bunkFuels" });
  db.VehicleFuel.belongsTo(db.Bunk, { foreignKey: "bunkId", as: "bunk" });
}

// Bunk -> BunkStatement
if (db.Bunk && db.BunkStatement) {
  db.Bunk.hasMany(db.BunkStatement, { foreignKey: "bunkId", as: "bunkStatements" });
  db.BunkStatement.belongsTo(db.Bunk, { foreignKey: "bunkId", as: "bunk" });
}

// Vehicle -> BunkStatement
if (db.Vehicle && db.BunkStatement) {
  db.Vehicle.hasMany(db.BunkStatement, { foreignKey: "vehicleId", as: "vehicleStatements" });
  db.BunkStatement.belongsTo(db.Vehicle, { foreignKey: "vehicleId", as: "vehicle" });
}

// VehicleFuel -> BunkStatement
if (db.VehicleFuel && db.BunkStatement) {
  db.VehicleFuel.hasMany(db.BunkStatement, { foreignKey: "fuelId", as: "fuelStatements" });
  db.BunkStatement.belongsTo(db.VehicleFuel, { foreignKey: "fuelId", as: "fuel" });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
