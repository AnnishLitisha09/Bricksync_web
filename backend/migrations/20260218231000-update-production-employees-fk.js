"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Remove the old foreign key referencing the 'employees' table
        // MySQL auto-generates names like 'production_employees_ibfk_2' if not specified
        // Based on the error message, 'production_employees_ibfk_2' is the one.
        try {
            await queryInterface.removeConstraint("production_employees", "production_employees_ibfk_2");
        } catch (err) {
            console.log("Could not find production_employees_ibfk_2, skipping...");
        }

        // 2. Add the new foreign key referencing the 'Users' table and 'userid' field
        await queryInterface.addConstraint("production_employees", {
            fields: ["employee_id"],
            type: "foreign key",
            name: "production_employees_user_fk",
            references: {
                table: "Users",
                field: "userid",
            },
            onDelete: "CASCADE",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint("production_employees", "production_employees_user_fk");
        await queryInterface.addConstraint("production_employees", {
            fields: ["employee_id"],
            type: "foreign key",
            name: "production_employees_ibfk_2",
            references: {
                table: "employees",
                field: "employee_id",
            },
            onDelete: "CASCADE",
        });
    },
};
