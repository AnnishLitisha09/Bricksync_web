module.exports = (sequelize, DataTypes) => {
  const SparesTitle = sequelize.define(
    "SparesTitle",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bill_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "spares_titles",
      timestamps: true,
    }
  );

  return SparesTitle;
};
