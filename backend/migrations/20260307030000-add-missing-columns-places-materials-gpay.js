"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add places to order_items
    const orderItemsDesc = await queryInterface.describeTable("order_items");
    if (!orderItemsDesc.places) {
      await queryInterface.addColumn("order_items", "places", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add raw_materials_used to production_log
    const productionLogDesc = await queryInterface.describeTable("production_log");
    if (!productionLogDesc.raw_materials_used) {
      await queryInterface.addColumn("production_log", "raw_materials_used", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const orderItemsDesc = await queryInterface.describeTable("order_items");
    if (orderItemsDesc.places) {
      await queryInterface.removeColumn("order_items", "places");
    }

    const productionLogDesc = await queryInterface.describeTable("production_log");
    if (productionLogDesc.raw_materials_used) {
      await queryInterface.removeColumn("production_log", "raw_materials_used");
    }
  },
};
