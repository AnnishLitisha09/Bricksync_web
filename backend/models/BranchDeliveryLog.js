module.exports = (sequelize, DataTypes) => {
  const BranchDeliveryLog = sequelize.define(
    "BranchDeliveryLog",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      office_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cursor_load_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: DataTypes.STRING(50),
      product_id: DataTypes.INTEGER,
      quantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      vehicle_id: DataTypes.INTEGER,
      vehicle_number: DataTypes.STRING(100),
      driver_name: DataTypes.STRING(150),
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_added_to_stock: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: DataTypes.TEXT,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "branch_delivery_logs",
      timestamps: true,
    }
  );

  BranchDeliveryLog.associate = (models) => {
    BranchDeliveryLog.belongsTo(models.Office, {
      foreignKey: "office_id",
      as: "office",
    });
    BranchDeliveryLog.belongsTo(models.CursorLoad, {
      foreignKey: "cursor_load_id",
      as: "cursorLoad",
    });
    BranchDeliveryLog.belongsTo(models.Product, {
      foreignKey: "product_id",
      as: "product",
    });
  };

  return BranchDeliveryLog;
};
