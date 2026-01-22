"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vehicles", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      vehicleName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      insurance: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      pollution: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      rcDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vehicles");
  },
};
