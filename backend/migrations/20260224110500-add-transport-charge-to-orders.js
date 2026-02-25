"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("orders", "transport_charge", {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.0,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("orders", "transport_charge");
    },
};
