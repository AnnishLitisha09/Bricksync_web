'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Add columns to orders
        const ordersTable = await queryInterface.describeTable('orders');
        if (!ordersTable.is_deleted) {
            await queryInterface.addColumn('orders', 'is_deleted', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });
        }
        if (!ordersTable.deleted_at) {
            await queryInterface.addColumn('orders', 'deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }

        // Add columns to customer_statements
        const statementsTable = await queryInterface.describeTable('customer_statements');
        if (!statementsTable.is_deleted) {
            await queryInterface.addColumn('customer_statements', 'is_deleted', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });
        }
        if (!statementsTable.deleted_at) {
            await queryInterface.addColumn('customer_statements', 'deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }

        // Add columns to call_logs
        const callLogsTable = await queryInterface.describeTable('call_logs');
        if (!callLogsTable.is_deleted) {
            await queryInterface.addColumn('call_logs', 'is_deleted', {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            });
        }
        if (!callLogsTable.deleted_at) {
            await queryInterface.addColumn('call_logs', 'deleted_at', {
                type: Sequelize.DATE,
                allowNull: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('orders', 'is_deleted');
        await queryInterface.removeColumn('orders', 'deleted_at');
        await queryInterface.removeColumn('customer_statements', 'is_deleted');
        await queryInterface.removeColumn('customer_statements', 'deleted_at');
        await queryInterface.removeColumn('call_logs', 'is_deleted');
        await queryInterface.removeColumn('call_logs', 'deleted_at');
    }
};
