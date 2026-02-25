'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable('customer_statements');
        if (!table.date) {
            await queryInterface.addColumn('customer_statements', 'date', {
                type: Sequelize.DATEONLY,
                allowNull: true,
            });

            // Backfill existing statements with created_at date
            await queryInterface.sequelize.query(
                "UPDATE customer_statements SET date = CAST(created_at AS DATE) WHERE date IS NULL"
            );
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('customer_statements', 'date');
    }
};
