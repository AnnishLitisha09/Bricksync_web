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
      },

      bank_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      payment_mode: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      description: DataTypes.TEXT,
    },
    {
      tableName: "fuel_statement",
      timestamps: true,
    }
  );

  FuelStatement.associate = (models) => {

    // ✅ Bank
    FuelStatement.belongsTo(models.BankTable, {
      foreignKey: "bank_id",
      targetKey: "id",
      as: "bank",
    });

    // ✅ Bunk
    FuelStatement.belongsTo(models.Bunk, {
      foreignKey: "bunk_id",
      targetKey: "id",
      as: "bunk",
    });
  };

  return FuelStatement;
};
