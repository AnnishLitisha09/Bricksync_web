"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("gprs", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            vehicleNumber: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            speed: {
                type: Sequelize.FLOAT,
                defaultValue: 0,
            },
            driverName: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            lastSync: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable("gprs");
    },
};
