"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("production_log", {
            production_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            office_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "offices",
                    key: "office_id",
                },
                onDelete: "CASCADE",
            },
            product_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "products",
                    key: "product_id",
                },
                onDelete: "CASCADE",
            },
            unit_produced: {
                type: Sequelize.DECIMAL(10, 2),
            },
            cement_used: {
                type: Sequelize.DECIMAL(10, 2),
            },
            production_date: {
                type: Sequelize.DATEONLY,
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
        await queryInterface.dropTable("production_log");
    },
};
