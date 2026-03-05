module.exports = (sequelize, DataTypes) => {
    const Gprs = sequelize.define(
        "Gprs",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            vehicleNumber: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            speed: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
            },
            driverName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            lastSync: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            userid: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            tableName: "gprs",
            timestamps: true,
        }
    );

    Gprs.associate = (models) => {
        Gprs.belongsTo(models.User, {
            foreignKey: "userid",
            as: "user",
        });
    };

    return Gprs;
};
