"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Attendances", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      userid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "userid",
        },
        onDelete: "CASCADE",
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      forenoon: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      afternoon: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.addConstraint("Attendances", {
      fields: ["userid", "date"],
      type: "unique",
      name: "unique_user_date_attendance",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Attendances");
  },
};
