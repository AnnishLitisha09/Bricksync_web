const db = require("./models");

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Database connected for sync");
    
    // Sync only the new models to avoid touching existing data
    await db.SparesTitle.sync({ alter: true });
    console.log("✅ SparesTitle table synced");
    
    await db.SparesImage.sync({ alter: true });
    console.log("✅ SparesImage table synced");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync Error:", error);
    process.exit(1);
  }
})();
