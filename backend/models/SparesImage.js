module.exports = (sequelize, DataTypes) => {
  const SparesImage = sequelize.define(
    "SparesImage",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      spares_title_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "spares_images",
      timestamps: true,
    }
  );

  return SparesImage;
};
