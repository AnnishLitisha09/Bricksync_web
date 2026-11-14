"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create cursors table
    await queryInterface.createTable("cursors", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 2. Create cursor_products table
    await queryInterface.createTable("cursor_products", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      cursor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "cursors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "products",
          key: "product_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 3. Create cursor_loads table
    await queryInterface.createTable("cursor_loads", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      cursor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "cursors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cursor_product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "cursor_products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      vehicle_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      driver_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      qty: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      remaining_qty: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      price_per_qty: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      has_loading_charge: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      loading_charge_per_unit: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "loaded",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 4. Create branch_delivery_logs table
    await queryInterface.createTable("branch_delivery_logs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      office_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "offices",
          key: "office_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      cursor_load_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "cursor_loads",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      vehicle_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      driver_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      is_added_to_stock: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // 5. Add cursor_load_id and buy_price to order_items if not exists
    try {
      const orderItemsTable = await queryInterface.describeTable("order_items");
      if (!orderItemsTable.cursor_load_id) {
        await queryInterface.addColumn("order_items", "cursor_load_id", {
          type: Sequelize.INTEGER,
          allowNull: true,
        });
      }
      if (!orderItemsTable.buy_price) {
        await queryInterface.addColumn("order_items", "buy_price", {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: true,
          defaultValue: 0.00,
        });
      }
    } catch (e) {
      console.warn("Could not check/add order_items columns:", e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn("order_items", "cursor_load_id");
      await queryInterface.removeColumn("order_items", "buy_price");
    } catch (_) {}
    await queryInterface.dropTable("branch_delivery_logs");
    await queryInterface.dropTable("cursor_loads");
    await queryInterface.dropTable("cursor_products");
    await queryInterface.dropTable("cursors");
  },
};
