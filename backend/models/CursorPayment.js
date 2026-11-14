module.exports = (sequelize, DataTypes) => {
  const CursorPayment = sequelize.define(
    "CursorPayment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      cursor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bank_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_mode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "BANK TRANSFER",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      description: DataTypes.TEXT,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "cursor_payments",
      timestamps: true,
    }
  );

  CursorPayment.associate = (models) => {
    CursorPayment.belongsTo(models.Cursor, {
      foreignKey: "cursor_id",
      as: "cursor",
    });
    CursorPayment.belongsTo(models.BankTable, {
      foreignKey: "bank_id",
      as: "bank",
    });
  };

  return CursorPayment;
};
