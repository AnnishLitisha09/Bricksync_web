'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('customers');

        if (!table.is_deleted) {
            await queryInterface.addColumn('customers', 'is_deleted', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });
        }

        if (!table.deleted_at) {
            await queryInterface.addColumn('customers', 'deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
    }
};
