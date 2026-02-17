module.exports = (sequelize, DataTypes) => {
  const ServiceStatement = sequelize.define(
    "ServiceStatement",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      service_shop_id: {
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
      tableName: "service_statement",
      timestamps: true,
    }
  );

  ServiceStatement.associate = (models) => {

    ServiceStatement.belongsTo(models.BankTable, {
      foreignKey: "bank_id",
      as: "bank",
    });

    ServiceStatement.belongsTo(models.ServiceShop, {
      foreignKey: "service_shop_id",
      as: "shop",
    });

  };

  return ServiceStatement;
};
