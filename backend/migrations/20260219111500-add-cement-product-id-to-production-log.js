"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("production_log", "cement_product_id", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "products",
                key: "product_id",
            },
            onDelete: "SET NULL",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("production_log", "cement_product_id");
    },
};
