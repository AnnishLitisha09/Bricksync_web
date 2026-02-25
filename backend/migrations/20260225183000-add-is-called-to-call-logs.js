'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('call_logs', 'is_called', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            after: 'description'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('call_logs', 'is_called');
    }
};
