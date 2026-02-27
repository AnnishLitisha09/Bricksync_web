'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Invoices', 'notifyDriver', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('Invoices', 'driverId', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Invoices', 'notifyDriver');
        await queryInterface.removeColumn('Invoices', 'driverId');
    }
};
