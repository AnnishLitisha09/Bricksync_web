"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Add order_item_id to order_employees
        await queryInterface.addColumn("order_employees", "order_item_id", {
            type: Sequelize.INTEGER,
            allowNull: true, // Initially true to migrate data
            references: {
                model: "order_items",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        });

        // 2. Migrate existing data
        // Link existing order_employees to the FIRST order_item of their respective order
        const [employees] = await queryInterface.sequelize.query(
            "SELECT id, order_id FROM order_employees"
        );

        for (const emp of employees) {
            const [items] = await queryInterface.sequelize.query(
                `SELECT id FROM order_items WHERE order_id = ${emp.order_id} LIMIT 1`
            );
            if (items.length > 0) {
                await queryInterface.sequelize.query(
                    `UPDATE order_employees SET order_item_id = ${items[0].id} WHERE id = ${emp.id}`
                );
            }
        }

        // 3. Make order_id nullable in order_employees (or we could eventually remove it)
        await queryInterface.changeColumn("order_employees", "order_id", {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
    },

    down: async (queryInterface, Sequelize) => {
        // 1. Reverse migration: restore order_id from order_item_id
        const [employees] = await queryInterface.sequelize.query(
            "SELECT id, order_item_id FROM order_employees WHERE order_item_id IS NOT NULL"
        );

        for (const emp of employees) {
            const [items] = await queryInterface.sequelize.query(
                `SELECT order_id FROM order_items WHERE id = ${emp.order_item_id} LIMIT 1`
            );
            if (items.length > 0) {
                await queryInterface.sequelize.query(
                    `UPDATE order_employees SET order_id = ${items[0].order_id} WHERE id = ${emp.id}`
                );
            }
        }

        // 2. Remove order_item_id
        await queryInterface.removeColumn("order_employees", "order_item_id");

        // 3. Make order_id non-nullable again
        await queryInterface.changeColumn("order_employees", "order_id", {
            type: Sequelize.INTEGER,
            allowNull: false,
        });
    },
};
