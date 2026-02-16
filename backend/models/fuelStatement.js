// models/fuelStatement.js
module.exports = (sequelize, DataTypes) => {
  const FuelStatement = sequelize.define(
    "FuelStatement",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      bunk_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "bunks",
          key: "id",
        },
      },

      bank_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "bank_details",
          key: "id",
        },
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      payment_mode: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "fuel_statement",
      timestamps: true,
    }
  );

  FuelStatement.associate = (models) => {
    FuelStatement.belongsTo(models.BankTable, {
      foreignKey: "bank_id",
      as: "bank",
    });

    FuelStatement.belongsTo(models.Bunk, {
      foreignKey: "bunk_id",
      as: "bunk",
    });
  };

  return FuelStatement;
};
