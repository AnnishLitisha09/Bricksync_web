"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WalletTransactions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "Users",
          },
          key: "userid",
        },
        onDelete: "CASCADE",
      },

      bank_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "bank_details",   // ✅ FIXED HERE
          },
          key: "id",
        },
      },

      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      type: {
        type: Sequelize.ENUM("received", "sent"),
      },

      category: {
        type: Sequelize.ENUM("salary", "advance"),
      },

      paymentType: Sequelize.STRING,
      description: Sequelize.STRING,

      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WalletTransactions");
  },
};
