'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('customer_statements');

        if (!table.is_deleted) {
            await queryInterface.addColumn('customer_statements', 'is_deleted', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
        }

        if (!table.deleted_at) {
            await queryInterface.addColumn('customer_statements', 'deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('customer_statements', 'is_deleted');
        await queryInterface.removeColumn('customer_statements', 'deleted_at');
    }
};
