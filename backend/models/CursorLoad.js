module.exports = (sequelize, DataTypes) => {
  const CursorLoad = sequelize.define(
    "CursorLoad",
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
      cursor_product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: DataTypes.STRING(50),
      product_id: DataTypes.INTEGER,
      vehicle_id: DataTypes.INTEGER,
      vehicle_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      driver_id: DataTypes.INTEGER,
      driver_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      qty: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      remaining_qty: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      price_per_qty: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      has_loading_charge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      loading_charge_per_unit: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
      },
      customer_name: DataTypes.STRING(255),
      customer_id: DataTypes.INTEGER,
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "loaded",
      },
      notes: DataTypes.TEXT,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "cursor_loads",
      timestamps: true,
    }
  );

  CursorLoad.associate = (models) => {
    CursorLoad.belongsTo(models.Cursor, {
      foreignKey: "cursor_id",
      as: "cursor",
    });
    CursorLoad.belongsTo(models.CursorProduct, {
      foreignKey: "cursor_product_id",
      as: "cursorProduct",
    });
    CursorLoad.belongsTo(models.Vehicle, {
      foreignKey: "vehicle_id",
      as: "vehicle",
    });
    CursorLoad.belongsTo(models.Employee, {
      foreignKey: "driver_id",
      as: "driver",
    });
    CursorLoad.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer",
    });
    CursorLoad.hasMany(models.OrderItem, {
      foreignKey: "cursor_load_id",
      as: "orderItems",
    });
    CursorLoad.hasMany(models.BranchDeliveryLog, {
      foreignKey: "cursor_load_id",
      as: "branchDeliveries",
    });
  };

  return CursorLoad;
};
