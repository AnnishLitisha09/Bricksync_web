'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('customer_statements', 'bank_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'bank_details',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('customer_statements', 'bank_id');
    }
};
