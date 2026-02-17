module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      forenoon: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      afternoon: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "Attendances",
      timestamps: true,
    }
  );

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, {
      foreignKey: "userid",
    });
  };

  return Attendance;
};
