module.exports = (sequelize, DataTypes) => {
  const CursorProduct = sequelize.define(
    "CursorProduct",
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
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "cursor_products",
      timestamps: true,
    }
  );

  CursorProduct.associate = (models) => {
    CursorProduct.belongsTo(models.Cursor, {
      foreignKey: "cursor_id",
      as: "cursor",
    });
    CursorProduct.belongsTo(models.Product, {
      foreignKey: "product_id",
      as: "masterProduct",
    });
    CursorProduct.hasMany(models.CursorLoad, {
      foreignKey: "cursor_product_id",
      as: "loads",
    });
  };

  return CursorProduct;
};
