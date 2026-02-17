module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define(
    "WalletTransaction",
    {
      userid: DataTypes.INTEGER,
      bank_id: DataTypes.INTEGER,
      amount: DataTypes.FLOAT,
      type: DataTypes.STRING,
      category: DataTypes.STRING,
      paymentType: DataTypes.STRING,
      description: DataTypes.STRING,
      date: DataTypes.DATE,
    },
    {
      tableName: "WalletTransactions",
      timestamps: true,
    }
  );

  WalletTransaction.associate = (models) => {

    WalletTransaction.belongsTo(models.User, {
      foreignKey: "userid",
      as: "user",
    });

    WalletTransaction.belongsTo(models.BankTable, {
      foreignKey: "bank_id",
      as: "bank",
    });

  };

  return WalletTransaction;
};
