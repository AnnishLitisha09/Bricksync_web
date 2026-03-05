"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("gprs", "userid", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "Users",
                key: "userid",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("gprs", "userid");
    },
};
