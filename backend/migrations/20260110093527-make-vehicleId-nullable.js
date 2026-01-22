'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('bunk_statements', 'vehicleId', {
      type: Sequelize.INTEGER,
      allowNull: true, // ✅ make nullable
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('bunk_statements', 'vehicleId', {
      type: Sequelize.INTEGER,
      allowNull: false, // revert back to NOT NULL
    });
  }
};
