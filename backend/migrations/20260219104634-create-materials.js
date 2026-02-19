'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Material Suppliers
    await queryInterface.createTable("material_suppliers", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      shop_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      owner_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      phone_no: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
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

    // 2. Material Supplier Fields
    await queryInterface.createTable("material_supplier_fields", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "material_suppliers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      field_name: {
        type: Sequelize.STRING,
        allowNull: false,
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

    // 3. Material Entries
    await queryInterface.createTable("material_entries", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "material_suppliers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "product_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      office_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "offices",
          key: "office_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      units: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
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

    // 4. Material Entry Fields
    await queryInterface.createTable("material_entry_fields", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entry_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "material_entries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      field_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      field_value: {
        type: Sequelize.STRING,
        allowNull: false,
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

    // 5. Material Statements
    await queryInterface.createTable("material_statements", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "material_suppliers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
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
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_mode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("material_statements");
    await queryInterface.dropTable("material_entry_fields");
    await queryInterface.dropTable("material_entries");
    await queryInterface.dropTable("material_supplier_fields");
    await queryInterface.dropTable("material_suppliers");
  },
};
