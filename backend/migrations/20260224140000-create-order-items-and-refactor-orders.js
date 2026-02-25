'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Create order_items table
        await queryInterface.createTable('order_items', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
            product: {
                type: Sequelize.STRING,
                allowNull: true,
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
            quantity: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
            }
        });

        // 2. Migrate existing data from orders to order_items
        const [orders] = await queryInterface.sequelize.query('SELECT * FROM orders');
        if (orders && orders.length > 0) {
            const orderItems = orders.map(order => ({
                order_id: order.order_id,
                product: order.product,
                material_id: order.material_id,
                office_id: order.office_id,
                quantity: order.quantity,
                price: order.price,
                created_at: order.createdAt || new Date(),
                updated_at: order.updatedAt || new Date()
            }));
            await queryInterface.bulkInsert('order_items', orderItems);
        }

        // 3. Remove columns from orders table
        await queryInterface.removeColumn('orders', 'product');
        await queryInterface.removeColumn('orders', 'material_id');
        await queryInterface.removeColumn('orders', 'office_id');
        await queryInterface.removeColumn('orders', 'quantity');
        await queryInterface.removeColumn('orders', 'price');
    },

    down: async (queryInterface, Sequelize) => {
        // 1. Restore columns to orders table
        await queryInterface.addColumn('orders', 'product', { type: Sequelize.STRING, allowNull: true });
        await queryInterface.addColumn('orders', 'material_id', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('orders', 'office_id', { type: Sequelize.INTEGER, allowNull: true });
        await queryInterface.addColumn('orders', 'quantity', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 });
        await queryInterface.addColumn('orders', 'price', { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 });

        // 2. Migrate data back (this is tricky for multi-item orders, will just take the first item)
        const [items] = await queryInterface.sequelize.query('SELECT * FROM order_items GROUP BY order_id');
        for (const item of items) {
            await queryInterface.sequelize.query(
                `UPDATE orders SET product = ?, material_id = ?, office_id = ?, quantity = ?, price = ? WHERE order_id = ?`,
                {
                    replacements: [item.product, item.material_id, item.office_id, item.quantity, item.price, item.order_id]
                }
            );
        }

        // 3. Drop order_items table
        await queryInterface.dropTable('order_items');
    }
};
