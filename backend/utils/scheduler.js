const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Vehicle } = require("../models");
const { Op } = require("sequelize");
const sendEmail = require("./sendEmail");

/**
 * 🔹 RUNS AT 12:00 AM SHARP EVERY DAY
 */
const initScheduledTasks = () => {
    // 0 0 * * * = Midnight
    cron.schedule("0 0 * * *", async () => {
        console.log("🕒 [Scheduler] Initializing midnight maintenance node...");

        await runAutomatedBackup();
        await checkVehicleExpirations();
    });
};

/**
 * 🔹 TASK 1: Automated SQL Backup
 */
async function runAutomatedBackup() {
    const dbName = process.env.DB_NAME || "bricksync";
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASS || "";
    const backupDir = path.join(__dirname, "../backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `auto-backup-${Date.now()}.sql`;
    const filePath = path.join(backupDir, fileName);

    let command = `mysqldump -u ${user} `;
    if (password) command += `-p${password} `;
    command += `${dbName} > "${filePath}"`;

    exec(command, async (error) => {
        if (error) {
            console.error(`❌ [Schedule] Backup failed: ${error.message}`);
            return;
        }

        const stats = fs.statSync(filePath);

        try {
            await sendEmail(
                "bricksync0001@gmail.com",
                "Bricksync Automated Daily Backup - SQL Export",
                `<h2>Midnight System Snapshot</h2>
                 <p>Automated backup executed successfully at 12:00 AM.</p>
                 <p>File: <b>${fileName}</b></p>
                 <p>Size: <b>${(stats.size / 1024).toFixed(2)} KB</b></p>
                 <hr>
                 <p><i>This is an automated system message.</i></p>`,
                [{ filename: fileName, path: filePath }]
            );
            console.log("✅ [Schedule] Backup emailed successfully.");
        } catch (emailErr) {
            console.error("❌ [Schedule] Backup email failed:", emailErr);
        }
    });
}

/**
 * 🔹 TASK 2: 7-Day Expiration Alerts
 */
async function checkVehicleExpirations() {
    try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 7);
        targetDate.setHours(0, 0, 0, 0);

        // Find vehicles expiring exactly on the target date
        const expiringVehicles = await Vehicle.findAll({
            where: {
                [Op.or]: [
                    { insurance: { [Op.eq]: targetDate } },
                    { pollution: { [Op.eq]: targetDate } },
                    { rcDate: { [Op.eq]: targetDate } }
                ],
                isActive: true
            }
        });

        if (expiringVehicles.length === 0) {
            console.log("ℹ️ [Schedule] No vehicle expirations found for 7-day reminder.");
            return;
        }

        let emailContent = `
            <h2>⚠️ 7-Day Expiration Alert</h2>
            <p>The following vehicles have certificates expiring in exactly 7 days (${targetDate.toLocaleDateString()}):</p>
            <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
                <tr style="background-color: #f2f2f2;">
                    <th>Vehicle Name</th>
                    <th>Vehicle Number</th>
                    <th>Type of Expiration</th>
                </tr>
        `;

        expiringVehicles.forEach(v => {
            const types = [];
            if (new Date(v.insurance).toDateString() === targetDate.toDateString()) types.push("Insurance");
            if (new Date(v.pollution).toDateString() === targetDate.toDateString()) types.push("Pollution");
            if (new Date(v.rcDate).toDateString() === targetDate.toDateString()) types.push("RC");

            emailContent += `
                <tr>
                    <td>${v.vehicleName}</td>
                    <td><b>${v.vehicleNumber}</b></td>
                    <td><span style="color: #e53e3e; font-weight: bold;">${types.join(", ")}</span></td>
                </tr>
            `;
        });

        emailContent += `</table><p>Please update these records in the Bricksync Management Console.</p>`;

        await sendEmail(
            "bricksync0001@gmail.com",
            "⚠️ Attention: Vehicle Expirations in 7 Days",
            emailContent
        );
        console.log(`✅ [Schedule] Sent expiration alerts for ${expiringVehicles.length} vehicles.`);

    } catch (err) {
        console.error("❌ [Schedule] Expiration check failed:", err);
    }
}

module.exports = { initScheduledTasks };
