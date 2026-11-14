module.exports = (sequelize, DataTypes) => {
  const Cursor = sequelize.define(
    "Cursor",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: DataTypes.STRING(50),
      location: DataTypes.STRING(255),
      notes: DataTypes.TEXT,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "cursors",
      timestamps: true,
    }
  );

  Cursor.associate = (models) => {
    Cursor.hasMany(models.CursorProduct, {
      foreignKey: "cursor_id",
      as: "products",
    });
    Cursor.hasMany(models.CursorLoad, {
      foreignKey: "cursor_id",
      as: "loads",
    });
    Cursor.hasMany(models.CursorPayment, {
      foreignKey: "cursor_id",
      as: "payments",
    });
  };

  return Cursor;
};
