"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add price_per_stock to products table
        await queryInterface.addColumn("products", "price_per_stock", {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        });

        // Add number_of_stocks to production_log table
        await queryInterface.addColumn("production_log", "number_of_stocks", {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 0,
        });

        // Add price_per_stock to production_log table
        await queryInterface.addColumn("production_log", "price_per_stock", {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("products", "price_per_stock");
        await queryInterface.removeColumn("production_log", "number_of_stocks");
        await queryInterface.removeColumn("production_log", "price_per_stock");
    },
};
