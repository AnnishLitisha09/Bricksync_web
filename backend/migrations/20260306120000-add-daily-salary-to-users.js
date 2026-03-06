"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("Users", "dailySalary", {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 750.0,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("Users", "dailySalary");
    },
};
