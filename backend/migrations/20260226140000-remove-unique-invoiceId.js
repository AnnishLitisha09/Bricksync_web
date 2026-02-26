module.exports = {
    up: async (queryInterface, Sequelize) => {
        // 1. Remove unique constraint from invoiceId
        // In MySQL, the index name is usually just the column name if created via 'unique: true'
        try {
            await queryInterface.removeIndex('Invoices', 'invoiceId');
        } catch (error) {
            console.log('Index might not exist or has different name, skipping removal...');
        }

        // 2. Add materialId and officeId
        await queryInterface.addColumn('Invoices', 'materialId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
        await queryInterface.addColumn('Invoices', 'officeId', {
            type: Sequelize.INTEGER,
            allowNull: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex('Invoices', ['invoiceId'], {
            unique: true,
            name: 'invoiceId'
        });
        await queryInterface.removeColumn('Invoices', 'materialId');
        await queryInterface.removeColumn('Invoices', 'officeId');
    }
};
