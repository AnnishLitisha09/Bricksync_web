"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("security_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ip_address: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      endpoint: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      method: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      threat_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      status_code: {
        type: Sequelize.INTEGER,
        defaultValue: 403,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("security_logs");
  },
};
