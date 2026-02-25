module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Invoices', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            invoiceId: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            customerNumber: {
                type: Sequelize.STRING
            },
            customerPhone: {
                type: Sequelize.STRING
            },
            customerAddress: {
                type: Sequelize.TEXT
            },
            date: {
                type: Sequelize.DATE
            },
            transportMode: {
                type: Sequelize.STRING,
                defaultValue: "ROAD"
            },
            vehicleNumber: {
                type: Sequelize.STRING
            },
            materialName: {
                type: Sequelize.STRING
            },
            office: {
                type: Sequelize.STRING
            },
            quantity: {
                type: Sequelize.FLOAT
            },
            ratePerUnit: {
                type: Sequelize.FLOAT
            },
            sgst: {
                type: Sequelize.FLOAT
            },
            cgst: {
                type: Sequelize.FLOAT
            },
            totalAmount: {
                type: Sequelize.FLOAT
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            pdfPath: {
                type: Sequelize.STRING
            },
            filename: {
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
        await queryInterface.dropTable('Invoices');
    }
};
