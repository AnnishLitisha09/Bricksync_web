const { sequelize } = require('../models');

async function migrate() {
    console.log("🚀 Starting database migration: Adding 'data' to Notifications table...");
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Notifications');

        if (!tableInfo.data) {
            await queryInterface.addColumn('Notifications', 'data', {
                type: require('sequelize').DataTypes.JSON,
                allowNull: true
            });
            console.log("✅ Column 'data' added successfully.");
        } else {
            console.log("ℹ️ Column 'data' already exists.");
        }
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit(0);
    }
}

migrate();
