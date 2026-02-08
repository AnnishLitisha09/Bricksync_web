"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Add column as NULLABLE first
    await queryInterface.addColumn("vehicle_services", "serviceShopId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "service_shop",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("vehicle_services", "serviceShopId");
  },
};
