'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('vehicles', 'rcImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('vehicles', 'insuranceImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('vehicles', 'pollutionImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('vehicles', 'speedImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('vehicles', 'rcImage');
    await queryInterface.removeColumn('vehicles', 'insuranceImage');
    await queryInterface.removeColumn('vehicles', 'pollutionImage');
    await queryInterface.removeColumn('vehicles', 'speedImage');
  }
};
