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
        type: DataTypes.STRING,
        allowNull: false,
      },

      holderName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      bankTransfer: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      phonepe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      gpay: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "bank_details",
      timestamps: true,
    }
  );

  return BankTable;
};
