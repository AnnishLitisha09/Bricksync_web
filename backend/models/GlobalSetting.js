"use strict";

module.exports = (sequelize, DataTypes) => {
    const GlobalSetting = sequelize.define(
        "GlobalSetting",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            key: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            value: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "GlobalSettings",
            timestamps: true,
        }
    );

    return GlobalSetting;
};
