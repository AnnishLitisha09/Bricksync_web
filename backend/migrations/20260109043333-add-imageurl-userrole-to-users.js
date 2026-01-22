"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "imageUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Users", "userRole", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: "1=Admin, 2=Driver, 3=Customer",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "imageUrl");
    await queryInterface.removeColumn("Users", "userRole");
  },
};
