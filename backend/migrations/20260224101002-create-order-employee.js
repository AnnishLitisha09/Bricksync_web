'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('order_employees', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'orders',
                    key: 'order_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            employee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'employees',
                    key: 'employee_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            role: {
                type: Sequelize.ENUM('driver', 'loader'),
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('order_employees');
    }
};
