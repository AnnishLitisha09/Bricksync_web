'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bunk_statements", {
      statementId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      bunkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "bunks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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

      fuelId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "vehicle_fuels",
          key: "fuelId",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      isFueled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 1, // 1 = added, 0 = deducted
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
    await queryInterface.dropTable("bunk_statements");
  },
};
