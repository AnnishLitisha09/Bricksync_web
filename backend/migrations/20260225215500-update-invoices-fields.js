module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Invoices', 'dateOfSupply', { type: Sequelize.DATE });
        await queryInterface.addColumn('Invoices', 'deliveryPlace', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'hsnCode', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'unit', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'igst', { type: Sequelize.FLOAT });
        await queryInterface.addColumn('Invoices', 'roundOff', { type: Sequelize.FLOAT });
        await queryInterface.addColumn('Invoices', 'totalInWords', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'billingName', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'billingAddress', { type: Sequelize.TEXT });
        await queryInterface.addColumn('Invoices', 'billingGstin', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'billingState', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'shippingName', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'shippingAddress', { type: Sequelize.TEXT });
        await queryInterface.addColumn('Invoices', 'shippingGstin', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'shippingState', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'bankName', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'accountNo', { type: Sequelize.STRING });
        await queryInterface.addColumn('Invoices', 'ifscCode', { type: Sequelize.STRING });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('Invoices', 'dateOfSupply');
        await queryInterface.removeColumn('Invoices', 'deliveryPlace');
        await queryInterface.removeColumn('Invoices', 'hsnCode');
        await queryInterface.removeColumn('Invoices', 'unit');
        await queryInterface.removeColumn('Invoices', 'igst');
        await queryInterface.removeColumn('Invoices', 'roundOff');
        await queryInterface.removeColumn('Invoices', 'totalInWords');
        await queryInterface.removeColumn('Invoices', 'billingName');
        await queryInterface.removeColumn('Invoices', 'billingAddress');
        await queryInterface.removeColumn('Invoices', 'billingGstin');
        await queryInterface.removeColumn('Invoices', 'billingState');
        await queryInterface.removeColumn('Invoices', 'shippingName');
        await queryInterface.removeColumn('Invoices', 'shippingAddress');
        await queryInterface.removeColumn('Invoices', 'shippingGstin');
        await queryInterface.removeColumn('Invoices', 'shippingState');
        await queryInterface.removeColumn('Invoices', 'bankName');
        await queryInterface.removeColumn('Invoices', 'accountNo');
        await queryInterface.removeColumn('Invoices', 'ifscCode');
    }
};
