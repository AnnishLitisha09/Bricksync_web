module.exports = (sequelize, DataTypes) => {
  const ServiceShop = sequelize.define(
    "ServiceShop",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      shop_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      owner: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },

      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      type: {
        type: DataTypes.ENUM("showroom", "paint", "tyre", "others"),
        allowNull: false,
      },
    },
    {
      tableName: "service_shop",
      timestamps: true,
    }
  );

  return ServiceShop;
};
