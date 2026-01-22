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

      drivingLicenceBackUrl: {       // ✅ New field
        type: DataTypes.STRING,
        allowNull: true,
      },

      drivingLicenceValidity: {      // ✅ New field
        type: DataTypes.DATE,
        allowNull: true,
      },

      userRole: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
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

  return User;
};
