'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.removeConstraint('order_employees', 'order_employees_ibfk_2');
        } catch (err) {
            console.log("Could not find order_employees_ibfk_2, skipping...");
        }

        await queryInterface.addConstraint('order_employees', {
            fields: ['employee_id'],
            type: 'foreign key',
            name: 'order_employees_user_fk',
            references: {
                table: 'Users',
                field: 'userid'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeConstraint('order_employees', 'order_employees_user_fk');
        await queryInterface.addConstraint('order_employees', {
            fields: ['employee_id'],
            type: 'foreign key',
            name: 'order_employees_ibfk_2',
            references: {
                table: 'employees',
                field: 'employee_id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
};
