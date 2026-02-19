"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("product_stock", {
            stock_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            product_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "products",
                    key: "product_id",
                },
                onDelete: "CASCADE",
            },
            office_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "offices",
                    key: "office_id",
                },
                onDelete: "CASCADE",
            },
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                defaultValue: 0,
            },
            is_deleted: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("product_stock");
    },
};
