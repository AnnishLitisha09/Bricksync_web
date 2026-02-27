module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      userid: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
      password: DataTypes.STRING,

      amount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },

      imageUrl: DataTypes.STRING,

      aadharUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      drivingLicenceUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      drivingLicenceBackUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      drivingLicenceValidity: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      userRole: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
      },

      // ✅ NEW FIELD
      staffRole: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },

      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      resetPasswordToken: DataTypes.STRING,
      resetPasswordExpires: DataTypes.DATE,
    },
    {
      tableName: "Users",
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Attendance, {
      foreignKey: "userid",
    });
  };

  return User;
};
