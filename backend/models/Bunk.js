// models/Bunk.js
module.exports = (sequelize, DataTypes) => {
  const Bunk = sequelize.define(
    "Bunk",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      bunkName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      ownerName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "bunks",
      timestamps: true,
    }
  );

  return Bunk;
};
