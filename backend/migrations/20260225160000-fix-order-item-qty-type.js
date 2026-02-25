'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('order_items', 'quantity', {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 1.000,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.changeColumn('order_items', 'quantity', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 1,
        });
    }
};
