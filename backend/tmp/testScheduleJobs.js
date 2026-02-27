const { populateNotifications, sendConsolidatedDailyEmail } = require('../utils/scheduler');

async function testJobs() {
    console.log("🚀 Starting manual test of scheduler jobs...");

    try {
        console.log("\n1️⃣ Testing populateNotifications()...");
        await populateNotifications();
        console.log("✅ populateNotifications() completed successfully.");

        console.log("\n2️⃣ Testing sendConsolidatedDailyEmail()...");
        await sendConsolidatedDailyEmail();
        console.log("✅ sendConsolidatedDailyEmail() completed successfully.");

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        console.log("\n🏁 Test run finished.");
        process.exit(0);
    }
}

testJobs();
