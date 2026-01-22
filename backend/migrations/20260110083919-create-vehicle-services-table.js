'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vehicle_services", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      vehicleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "vehicles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      topic: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      service_img: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      kilometer: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("vehicle_services");
  },
};
