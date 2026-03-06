"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("order_items", "loader_charge_per_unit", {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.0,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("order_items", "loader_charge_per_unit");
    },
};
