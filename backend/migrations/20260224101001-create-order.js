'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('orders', {
            order_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            cus_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            product: {
                type: Sequelize.STRING,
                allowNull: true
            },
            office_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'offices',
                    key: 'office_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            material_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'products',
                    key: 'product_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            vehicle_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'vehicles',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
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
        await queryInterface.dropTable('orders');
    }
};
