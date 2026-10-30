"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add gst_number, notes, tags to material_suppliers
    const suppliersDesc = await queryInterface.describeTable("material_suppliers");
    if (!suppliersDesc.gst_number) {
      await queryInterface.addColumn("material_suppliers", "gst_number", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
    if (!suppliersDesc.notes) {
      await queryInterface.addColumn("material_suppliers", "notes", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!suppliersDesc.tags) {
      await queryInterface.addColumn("material_suppliers", "tags", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // 2. Add unit_price to material_entries
    const entriesDesc = await queryInterface.describeTable("material_entries");
    if (!entriesDesc.unit_price) {
      await queryInterface.addColumn("material_entries", "unit_price", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  down: async (queryInterface) => {
    const suppliersDesc = await queryInterface.describeTable("material_suppliers");
    if (suppliersDesc.gst_number) {
      await queryInterface.removeColumn("material_suppliers", "gst_number");
    }
    if (suppliersDesc.notes) {
      await queryInterface.removeColumn("material_suppliers", "notes");
    }
    if (suppliersDesc.tags) {
      await queryInterface.removeColumn("material_suppliers", "tags");
    }

    const entriesDesc = await queryInterface.describeTable("material_entries");
    if (entriesDesc.unit_price) {
      await queryInterface.removeColumn("material_entries", "unit_price");
    }
  },
};
