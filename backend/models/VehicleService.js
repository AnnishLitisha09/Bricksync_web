module.exports = (sequelize, DataTypes) => {
  const VehicleService = sequelize.define(
    "VehicleService",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      topic: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      service_img: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      kilometer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "vehicle_services",
      timestamps: true,
    }
  );

  return VehicleService;
};
