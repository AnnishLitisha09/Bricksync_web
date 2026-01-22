module.exports = (sequelize, DataTypes) => {
  const VehicleFuel = sequelize.define(
    "VehicleFuel",
    {
      fuelId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bunkId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      volume: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      kilometer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // ✅ default 0 / false
      },
    },
    {
      tableName: "vehicle_fuels",
      timestamps: true,
    }
  );

  return VehicleFuel;
};
