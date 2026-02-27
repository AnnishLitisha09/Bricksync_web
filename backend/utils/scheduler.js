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
        console.log("🕒 [Scheduler] Midnight maintenance...");
        await deactivateExpiredInvoices();
    });

    // 10 0 * * * = 12:10 AM
    cron.schedule("10 0 * * *", async () => {
        console.log("🕒 [Scheduler] Running 12:10 AM Notification Population...");
        await populateNotifications();
    });

    // 0 18 * * * = 6:00 PM
    cron.schedule("0 18 * * *", async () => {
        console.log("🕒 [Scheduler] Running 6:00 PM Consolidated Email...");
        await sendConsolidatedDailyEmail();
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
 * 🔹 TASK 1: Populate Notifications (12:10 AM)
 * Checks Call Logs for TODAY and Vehicles expiring in exactly 5 days.
 */
async function populateNotifications() {
    try {
        const { Notification, CallLog, Vehicle, Customer } = require("../models");
        const d = new Date();
        const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        // 1. Check Call Logs for Today
        const todayCalls = await CallLog.findAll({
            where: { next_call_date: today, is_called: false, is_deleted: false },
            include: [{ model: Customer, as: 'customer', attributes: ['name'] }]
        });

        for (const call of todayCalls) {
            await Notification.create({
                title: "📞 Call Task Today",
                message: `Scheduled call for ${call.customer?.name || 'Customer'} today.`,
                type: 'CALL'
            });
        }

        // 2. Check Vehicle Expirations in 5 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 5);
        targetDate.setHours(0, 0, 0, 0);

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

        for (const v of expiringVehicles) {
            const types = [];
            if (new Date(v.insurance).toDateString() === targetDate.toDateString()) types.push("Insurance");
            if (new Date(v.pollution).toDateString() === targetDate.toDateString()) types.push("Pollution");
            if (new Date(v.rcDate).toDateString() === targetDate.toDateString()) types.push("RC");

            await Notification.create({
                title: "⚠️ Vehicle Expiry Soon",
                message: `${v.vehicleNumber}: ${types.join(", ")} expires in 5 days (${targetDate.toLocaleDateString()}).`,
                type: 'VEHICLE'
            });
        }

        console.log(`✅ [Schedule] Populated ${todayCalls.length + expiringVehicles.length} notifications.`);
    } catch (err) {
        console.error("❌ [Schedule] Notification population failed:", err);
    }
}

/**
 * 🔹 TASK 2: Consolidated 6:00 PM Email
 * Sends today's calls and 5-day vehicle expiries.
 */
async function sendConsolidatedDailyEmail() {
    try {
        const { CallLog, Vehicle, Customer } = require("../models");
        const d = new Date();
        const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        // Fetch Call Logs
        const todayCalls = await CallLog.findAll({
            where: { next_call_date: today, is_called: false, is_deleted: false },
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone_no'] }]
        });

        // Fetch Vehicle Expirations
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 5);
        targetDate.setHours(0, 0, 0, 0);

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

        if (todayCalls.length === 0 && expiringVehicles.length === 0) {
            console.log("ℹ️ [Schedule] No data for 6 PM consolidated email.");
            return;
        }

        let emailContent = `<div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h1 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Bricksync Daily Report - ${today}</h1>`;

        if (todayCalls.length > 0) {
            emailContent += `<h2 style="color: #f97316; margin-top: 30px;">📞 Today's Call Tasks</h2>
                <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #f8f9fa;"><th>Customer Name</th><th>Phone Number</th><th>Remark</th></tr>`;
            todayCalls.forEach(call => {
                emailContent += `<tr><td><b>${call.customer?.name || "N/A"}</b></td><td>${call.customer?.phone_no || "N/A"}</td><td>${call.description || "-"}</td></tr>`;
            });
            emailContent += `</table>`;
        }

        if (expiringVehicles.length > 0) {
            emailContent += `<h2 style="color: #e11d48; margin-top: 30px;">⚠️ Vehicle Expirations (In 5 Days)</h2>
                <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
                    <tr style="background-color: #f8f9fa;"><th>Vehicle Number</th><th>Vehicle Name</th><th>Expiring Documents</th></tr>`;
            expiringVehicles.forEach(v => {
                const types = [];
                if (new Date(v.insurance).toDateString() === targetDate.toDateString()) types.push("Insurance");
                if (new Date(v.pollution).toDateString() === targetDate.toDateString()) types.push("Pollution");
                if (new Date(v.rcDate).toDateString() === targetDate.toDateString()) types.push("RC");
                emailContent += `<tr><td><b>${v.vehicleNumber}</b></td><td>${v.vehicleName}</td><td style="color: #e11d48;">${types.join(", ")}</td></tr>`;
            });
            emailContent += `</table>`;
        }

        emailContent += `<p style="margin-top: 30px; font-size: 11px; color: #94a3b8;">This is an automated system report from Bricksync Management Console.</p></div>`;

        await sendEmail("bricksync001@gmail.com", `Bricksync Daily Report - ${today}`, emailContent);
        console.log(`✅ [Schedule] Sent 6 PM consolidated email.`);
    } catch (err) {
        console.error("❌ [Schedule] Consolidated email failed:", err);
    }
}

module.exports = { initScheduledTasks };
