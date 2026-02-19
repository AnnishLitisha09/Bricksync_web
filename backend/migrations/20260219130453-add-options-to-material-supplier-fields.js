'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("material_supplier_fields", "field_options", {
      type: Sequelize.TEXT, // Storing as stringified JSON for simplicity if JSON type is not available/reliable on all DBs, or use JSON if SQLite/MySQL/Postgres supports it. 
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("material_supplier_fields", "field_options");
  },
};
