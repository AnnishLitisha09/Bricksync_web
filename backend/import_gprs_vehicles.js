const db = require("./models");

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Database connected for vehicle import");
    
    // Get all unique vehicle numbers from GPRS table
    const gprsVehicles = await db.Gprs.findAll();
    console.log(`🔍 Found ${gprsVehicles.length} vehicles in GPRS table`);
    
    let importedCount = 0;
    for (const gv of gprsVehicles) {
      // Check if already in vehicles table
      const existing = await db.Vehicle.findOne({
        where: { vehicleNumber: gv.vehicleNumber }
      });
      
      if (!existing) {
        // Create in Registry Fleet with default values
        await db.Vehicle.create({
          vehicleName: gv.vehicleNumber, // Default name to number
          vehicleNumber: gv.vehicleNumber,
          insurance: new Date(), // Default to today (will show as expiring/expired soon)
          pollution: new Date(),
          rcDate: new Date(),
          kilometer: 0,
          isActive: true
        });
        console.log(`➕ Imported: ${gv.vehicleNumber}`);
        importedCount++;
      }
    }
    
    console.log(`🎉 Operation complete. Imported ${importedCount} new vehicles to Registry Fleet.`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Import Error:", error);
    process.exit(1);
  }
})();
