"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_statement", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      service_shop_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "service_shop",   // ✅ CORRECT TABLE
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      bank_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "bank_details",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      payment_mode: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.dropTable("service_statement");
  },
};
