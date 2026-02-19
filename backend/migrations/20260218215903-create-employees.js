"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("employees", {
            employee_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            employee_name: {
                type: Sequelize.STRING(150),
                allowNull: false,
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
        await queryInterface.dropTable("employees");
    },
};
