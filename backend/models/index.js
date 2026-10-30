const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const config = require("../config/config.js").development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    ...config,
    logging: false,
  }
);

const db = {};

/* LOAD MODELS */
fs.readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js"
  )
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

/* RUN ASSOCIATIONS */
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

/* VEHICLE RELATIONS */
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

/* SERVICE SHOP */
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

/* BUNK RELATIONS */
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

/* SPARES RELATIONS */
if (db.Vehicle && db.SparesTitle) {
  db.Vehicle.hasMany(db.SparesTitle, {
    foreignKey: "vehicle_id",
    as: "sparesTitles",
  });
  db.SparesTitle.belongsTo(db.Vehicle, {
    foreignKey: "vehicle_id",
    as: "vehicle",
  });
}

if (db.SparesTitle && db.SparesImage) {
  db.SparesTitle.hasMany(db.SparesImage, {
    foreignKey: "spares_title_id",
    as: "images",
  });
  db.SparesImage.belongsTo(db.SparesTitle, {
    foreignKey: "spares_title_id",
    as: "sparesTitle",
  });
}

/* CONNECTION TEST */
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
})();

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

module.exports = db;
