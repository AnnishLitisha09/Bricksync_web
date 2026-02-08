module.exports = (sequelize, DataTypes) => {
  const BankTable = sequelize.define(
    "BankTable",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      accountNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      holderName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      Gpay: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
    },
    {
      tableName: "bank_details",
      timestamps: true,
    },
  );

  return BankTable;
};