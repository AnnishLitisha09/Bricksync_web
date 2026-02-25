'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Notepads', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            verifiedId: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            title: {
                type: Sequelize.STRING
            },
            address: {
                type: Sequelize.TEXT
            },
            phone: {
                type: Sequelize.STRING
            },
            email: {
                type: Sequelize.STRING
            },
            website: {
                type: Sequelize.STRING
            },
            notes: {
                type: Sequelize.TEXT
            },
            companySignature: {
                type: Sequelize.STRING
            },
            pdfPath: {
                type: Sequelize.STRING
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Notepads');
    }
};
