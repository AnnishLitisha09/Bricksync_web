"use strict";

/**
 * Self-healing schema synchronizer.
 * Automatically verifies and creates required tables and columns
 * for Cursors, Cursor Products, Cursor Loads, and Branch Delivery Logs
 * without requiring manual migration commands on remote production servers.
 */
async function ensureCursorAndBranchTables(sequelize) {
  try {
    // 1. Create cursors table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`cursors\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) NULL,
        \`location\` VARCHAR(255) NULL,
        \`notes\` TEXT NULL,
        \`is_deleted\` TINYINT(1) DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create cursor_products table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`cursor_products\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`cursor_id\` INT NOT NULL,
        \`product_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(50) NOT NULL,
        \`product_id\` INT NULL,
        \`is_deleted\` TINYINT(1) DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_cursor_products_cursor_id\` (\`cursor_id\`),
        CONSTRAINT \`fk_cursor_products_cursor\` FOREIGN KEY (\`cursor_id\`) REFERENCES \`cursors\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Create cursor_loads table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`cursor_loads\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`cursor_id\` INT NOT NULL,
        \`cursor_product_id\` INT NULL,
        \`product_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(50) NULL,
        \`product_id\` INT NULL,
        \`vehicle_id\` INT NULL,
        \`vehicle_number\` VARCHAR(100) NOT NULL,
        \`driver_id\` INT NULL,
        \`driver_name\` VARCHAR(150) NOT NULL,
        \`qty\` DECIMAL(10, 3) NOT NULL,
        \`remaining_qty\` DECIMAL(10, 3) NOT NULL,
        \`price_per_qty\` DECIMAL(10, 2) NOT NULL,
        \`has_loading_charge\` TINYINT(1) DEFAULT 0,
        \`loading_charge_per_unit\` DECIMAL(10, 2) DEFAULT 0.00,
        \`customer_name\` VARCHAR(255) NULL,
        \`customer_id\` INT NULL,
        \`date\` DATE NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'loaded',
        \`notes\` TEXT NULL,
        \`is_deleted\` TINYINT(1) DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_cursor_loads_cursor_id\` (\`cursor_id\`),
        CONSTRAINT \`fk_cursor_loads_cursor\` FOREIGN KEY (\`cursor_id\`) REFERENCES \`cursors\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create branch_delivery_logs table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`branch_delivery_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`office_id\` INT NOT NULL,
        \`cursor_load_id\` INT NULL,
        \`product_name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(50) NULL,
        \`product_id\` INT NULL,
        \`quantity\` DECIMAL(10, 3) NOT NULL,
        \`price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`vehicle_id\` INT NULL,
        \`vehicle_number\` VARCHAR(100) NULL,
        \`driver_name\` VARCHAR(150) NULL,
        \`date\` DATE NOT NULL,
        \`is_added_to_stock\` TINYINT(1) DEFAULT 1,
        \`notes\` TEXT NULL,
        \`is_deleted\` TINYINT(1) DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_branch_delivery_office\` (\`office_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Create cursor_payments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`cursor_payments\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`cursor_id\` INT NOT NULL,
        \`bank_id\` INT NULL,
        \`amount\` DECIMAL(10, 2) NOT NULL,
        \`payment_mode\` VARCHAR(50) NOT NULL DEFAULT 'BANK TRANSFER',
        \`date\` DATE NOT NULL,
        \`description\` TEXT NULL,
        \`is_deleted\` TINYINT(1) DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_cursor_payments_cursor_id\` (\`cursor_id\`),
        CONSTRAINT \`fk_cursor_payments_cursor\` FOREIGN KEY (\`cursor_id\`) REFERENCES \`cursors\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Check and add columns to order_items
    const [cols] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'order_items'
        AND COLUMN_NAME IN ('cursor_load_id', 'buy_price');
    `);

    const existingCols = (cols || []).map((c) => c.COLUMN_NAME);

    if (!existingCols.includes("cursor_load_id")) {
      await sequelize.query(`
        ALTER TABLE \`order_items\` ADD COLUMN \`cursor_load_id\` INT NULL;
      `);
      console.log(" Added 'cursor_load_id' column to order_items");
    }

    if (!existingCols.includes("buy_price")) {
      await sequelize.query(`
        ALTER TABLE \`order_items\` ADD COLUMN \`buy_price\` DECIMAL(10, 2) DEFAULT 0.00;
      `);
      console.log(" Added 'buy_price' column to order_items");
    }

    // 6. Record in SequelizeMeta table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`SequelizeMeta\` (\`name\` VARCHAR(255) NOT NULL PRIMARY KEY);
    `);
    await sequelize.query(`
      INSERT IGNORE INTO \`SequelizeMeta\` (\`name\`)
      VALUES ('20260308000000-create-cursor-and-branch-delivery.js');
    `);

    console.log(" Schema sync verified: Cursor & Branch delivery tables are ready.");
    return true;
  } catch (error) {
    console.error(" Schema sync error:", error.message);
    return false;
  }
}

module.exports = { ensureCursorAndBranchTables };
