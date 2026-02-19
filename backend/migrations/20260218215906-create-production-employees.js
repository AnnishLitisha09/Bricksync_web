"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("production_employees", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            production_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "production_log",
                    key: "production_id",
                },
                onDelete: "CASCADE",
            },
            employee_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "employees",
                    key: "employee_id",
                },
                onDelete: "CASCADE",
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
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("production_employees");
    },
};
