const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Vehicle, CallLog, Customer } = require("../models");
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

    // 05 00 * * * = 12:05 AM
    cron.schedule("05 0 * * *", async () => {
        console.log("🕒 [Scheduler] Running 12:05 AM Call Reminders check...");
        await checkDailyCallReminders();
    });

    // Run every 30 minutes to deactivate expired invoices
    cron.schedule("*/30 * * * *", async () => {
        console.log("🕒 [Scheduler] Running expiry check for invoices...");
        await deactivateExpiredInvoices();
    });
};

/**
 * 🔹 TASK 0: Deactivate Invoices older than 3 hours
 */
async function deactivateExpiredInvoices() {
    try {
        const { Invoice } = require("../models");
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

        const [updatedCount] = await Invoice.update(
            { isActive: false },
            {
                where: {
                    isActive: true,
                    notifiedAt: {
                        [Op.lt]: threeHoursAgo
                    }
                }
            }
        );

        if (updatedCount > 0) {
            console.log(`✅ [Schedule] Deactivated ${updatedCount} expired invoices.`);
        }
    } catch (err) {
        console.error("❌ [Schedule] Invoice deactivation failed:", err);
    }
}

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
                "bricksync001@gmail.com",
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
            "bricksync001@gmail.com",
            "⚠️ Attention: Vehicle Expirations in 7 Days",
            emailContent
        );
        console.log(`✅ [Schedule] Sent expiration alerts for ${expiringVehicles.length} vehicles.`);

    } catch (err) {
        console.error("❌ [Schedule] Expiration check failed:", err);
    }
}

/**
 * 🔹 TASK 3: Daily Call Reminders (12:05 AM)
 */
async function checkDailyCallReminders() {
    try {
        // Use local date (YYYY-MM-DD) instead of UTC to avoid midnight timezone lag
        const d = new Date();
        const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        const todayCalls = await CallLog.findAll({
            where: {
                next_call_date: {
                    [Op.lte]: today
                },
                is_called: false,
                is_deleted: false
            },
            include: [{
                model: Customer,
                as: 'customer',
                attributes: ['name', 'phone_no']
            }]
        });

        if (todayCalls.length === 0) {
            console.log("ℹ️ [Schedule] No call reminders for today.");
            return;
        }

        let emailContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #f97316;">📞 Daily Call Reminders - ${today}</h2>
                <p>The following customers are scheduled for a call today:</p>
                <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
                    <tr style="background-color: #f8f9fa;">
                        <th>Customer Name</th>
                        <th>Phone Number</th>
                        <th>Remark / Description</th>
                    </tr>
        `;

        todayCalls.forEach(call => {
            emailContent += `
                <tr>
                    <td style="font-weight: bold;">${call.customer?.name || "N/A"}</td>
                    <td>${call.customer?.phone_no || "N/A"}</td>
                    <td>${call.description || "No remarks provided"}</td>
                </tr>
            `;
        });

        emailContent += `
                </table>
                <p style="margin-top: 20px; font-size: 12px; color: #777;">
                    <i>This is an automated reminder from the Bricksync Management System.</i>
                </p>
            </div>
        `;

        await sendEmail(
            "bricksync001@gmail.com",
            `📞 Call Reminders for Today (${today})`,
            emailContent
        );
        console.log(`✅ [Schedule] Sent ${todayCalls.length} call reminders to bricksync001@gmail.com`);

    } catch (err) {
        console.error("❌ [Schedule] Call reminders check failed:", err);
    }
}

module.exports = { initScheduledTasks };
