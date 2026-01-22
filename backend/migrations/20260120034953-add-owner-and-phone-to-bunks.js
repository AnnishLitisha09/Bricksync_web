"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("bunks", "ownerName", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Unknown",
    });

    await queryInterface.addColumn("bunks", "phoneNumber", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "0000000000",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("bunks", "ownerName");
    await queryInterface.removeColumn("bunks", "phoneNumber");
  },
};
