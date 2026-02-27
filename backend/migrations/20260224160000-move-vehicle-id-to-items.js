'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add vehicle_id to order_items
        await queryInterface.addColumn('order_items', 'vehicle_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'vehicles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 2. Migrate existing vehicle_id from orders to order_items
        const [orders] = await queryInterface.sequelize.query(
            'SELECT order_id, vehicle_id FROM orders'
        );

        for (const order of orders) {
            if (order.vehicle_id) {
                await queryInterface.sequelize.query(
                    `UPDATE order_items SET vehicle_id = ${order.vehicle_id} WHERE order_id = ${order.order_id}`
                );
            }
        }

        // 3. Remove vehicle_id from orders
        await queryInterface.removeColumn('orders', 'vehicle_id');
    },

    async down(queryInterface, Sequelize) {
        // 1. Add vehicle_id back to orders
        await queryInterface.addColumn('orders', 'vehicle_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'vehicles',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        });

        // 2. Migrate vehicle_id back from order_items (taking the first one)
        const [items] = await queryInterface.sequelize.query(
            'SELECT order_id, vehicle_id FROM order_items'
        );

        const processedOrders = new Set();
        for (const item of items) {
            if (item.vehicle_id && !processedOrders.has(item.order_id)) {
                await queryInterface.sequelize.query(
                    `UPDATE orders SET vehicle_id = ${item.vehicle_id} WHERE order_id = ${item.order_id}`
                );
                processedOrders.add(item.order_id);
            }
        }

        // 3. Remove vehicle_id from order_items
        await queryInterface.removeColumn('order_items', 'vehicle_id');
    }
};
