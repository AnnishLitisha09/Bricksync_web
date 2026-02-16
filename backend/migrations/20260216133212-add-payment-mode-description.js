"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("fuel_statement", "payment_mode", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.addColumn("fuel_statement", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("fuel_statement", "payment_mode");
    await queryInterface.removeColumn("fuel_statement", "description");
  },
};
