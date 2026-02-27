const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { Vehicle, CallLog, Customer, Notification } = require("../models");
const { Op } = require("sequelize");
const sendEmail = require("./sendEmail");

/**
 * 🔹 RUNS AT THE START OF THE APP
 */
const initScheduledTasks = () => {
    // 10 0 * * * = 12:10 AM - POPULATE NOTIFICATIONS
    cron.schedule("50 0 * * *", async () => {
        console.log("🕒 [Scheduler] Running 12:10 AM Notification Population...");
        await populateNotifications();
    });

    // 30 6 * * * = 6:30 AM - SEND CONSOLIDATED EMAIL
    cron.schedule("30 6 * * *", async () => {
        console.log("🕒 [Scheduler] Running 6:30 AM Consolidated Email...");
        await sendConsolidatedDailyEmail();
    });

    // Keeping invoice deactivation as it's a maintenance task, not a "schedule" like the removed ones.
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
 * Checks Call Logs for TODAY and Vehicles expiring in <= 5 days.
 */
async function populateNotifications() {
    try {
        const d = new Date();
        const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        // 1. Check Call Logs for Today
        const todayCalls = await CallLog.findAll({
            where: { next_call_date: today, is_called: false, is_deleted: false },
            include: [{ model: Customer, as: 'customer' }]
        });

        for (const call of todayCalls) {
            await Notification.create({
                title: "📞 Call Task Today",
                message: `Scheduled call for ${call.customer?.name || 'Customer'} today.`,
                type: 'CALL',
                data: {
                    customerName: call.customer?.name || "N/A",
                    phoneNo: call.customer?.phone_no || "N/A",
                    lastCallDate: call.call_date || "N/A",
                    nextCallDate: call.next_call_date,
                    description: call.description || ""
                }
            });
        }

        // 2. Check Vehicle Expirations in <= 5 days
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 5);
        targetDate.setHours(23, 59, 59, 999);

        const expiringVehicles = await Vehicle.findAll({
            where: {
                [Op.or]: [
                    { insurance: { [Op.lte]: targetDate } },
                    { pollution: { [Op.lte]: targetDate } },
                    { rcDate: { [Op.lte]: targetDate } }
                ],
                isActive: true
            }
        });

        for (const v of expiringVehicles) {
            const types = [];
            const now = new Date();
            if (new Date(v.insurance) <= targetDate && new Date(v.insurance) >= now) types.push("Insurance");
            if (new Date(v.pollution) <= targetDate && new Date(v.pollution) >= now) types.push("Pollution");
            if (new Date(v.rcDate) <= targetDate && new Date(v.rcDate) >= now) types.push("RC");

            if (types.length > 0) {
                await Notification.create({
                    title: "⚠️ Vehicle Expiry Soon",
                    message: `${v.vehicleNumber}: ${types.join(", ")} expiring within 5 days.`,
                    type: 'VEHICLE',
                    data: {
                        vehicleNumber: v.vehicleNumber,
                        vehicleName: v.vehicleName,
                        expiringTypes: types,
                        insurance: v.insurance,
                        pollution: v.pollution,
                        rcDate: v.rcDate
                    }
                });
            }
        }

        console.log(`✅ [Schedule] Populated ${todayCalls.length + expiringVehicles.length} notifications.`);
    } catch (err) {
        console.error("❌ [Schedule] Notification population failed:", err);
    }
}

/**
 * 🔹 TASK 2: Consolidated 6:30 AM Email
 * Sends what are the notifications.
 */
async function sendConsolidatedDailyEmail() {
    try {
        const d = new Date();
        const startOfToday = new Date(d.setHours(0, 0, 0, 0));

        const notifications = await Notification.findAll({
            where: {
                createdAt: { [Op.gte]: startOfToday }
            }
        });

        if (notifications.length === 0) {
            console.log("ℹ️ [Schedule] No notifications for 6:30 AM consolidated email.");
            return;
        }

        const todayStr = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

        let emailContent = `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 20px; max-width: 800px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-bottom: 4px solid #f97316;">
                <h1 style="color: #1e293b; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Bricksync Daily Notifications</h1>
                <p style="color: #64748b; margin: 5px 0 0 0; font-weight: 600;">Date: ${todayStr}</p>
            </div>`;

        const callNotifications = notifications.filter(n => n.type === 'CALL');
        const vehicleNotifications = notifications.filter(n => n.type === 'VEHICLE');

        if (callNotifications.length > 0) {
            emailContent += `<h2 style="color: #2563eb; border-left: 4px solid #2563eb; padding-left: 10px; margin-top: 30px; font-size: 18px; text-transform: uppercase;">📞 Call Notifications</h2>
                <table cellpadding="12" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; margin-top: 10px;">
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="border: 1px solid #e2e8f0;">Customer Name</th>
                        <th style="border: 1px solid #e2e8f0;">Phone</th>
                        <th style="border: 1px solid #e2e8f0;">Last Called</th>
                        <th style="border: 1px solid #e2e8f0;">Description</th>
                    </tr>`;
            callNotifications.forEach(n => {
                const data = n.data || {};
                emailContent += `<tr>
                    <td style="border: 1px solid #e2e8f0;"><b>${data.customerName || "N/A"}</b></td>
                    <td style="border: 1px solid #e2e8f0;">${data.phoneNo || "N/A"}</td>
                    <td style="border: 1px solid #e2e8f0;">${data.lastCallDate || "N/A"}</td>
                    <td style="border: 1px solid #e2e8f0;">${data.description || "-"}</td>
                </tr>`;
            });
            emailContent += `</table>`;
        }

        if (vehicleNotifications.length > 0) {
            emailContent += `<h2 style="color: #dc2626; border-left: 4px solid #dc2626; padding-left: 10px; margin-top: 30px; font-size: 18px; text-transform: uppercase;">⚠️ Vehicle Expirations</h2>
                <table cellpadding="12" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; margin-top: 10px;">
                    <tr style="background-color: #fff1f2; text-align: left;">
                        <th style="border: 1px solid #e2e8f0;">Vehicle Number</th>
                        <th style="border: 1px solid #e2e8f0;">Expiring Documents</th>
                    </tr>`;
            vehicleNotifications.forEach(n => {
                const data = n.data || {};
                emailContent += `<tr>
                    <td style="border: 1px solid #e2e8f0;"><b>${data.vehicleNumber || "N/A"}</b></td>
                    <td style="border: 1px solid #e2e8f0; color: #dc2626; font-weight: 600;">${(data.expiringTypes || []).join(", ") || "N/A"}</td>
                </tr>`;
            });
            emailContent += `</table>`;
        }

        emailContent += `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            <p>This is an automated report generated by the Bricksync Management Console.</p>
        </div></div>`;

        await sendEmail("bricksync001@gmail.com", `Bricksync Daily Notifications - ${todayStr}`, emailContent);
        console.log(`✅ [Schedule] Sent 6:30 AM consolidated email.`);
    } catch (err) {
        console.error("❌ [Schedule] Consolidated email failed:", err);
    }
}

module.exports = {
    initScheduledTasks,
    populateNotifications,
    sendConsolidatedDailyEmail
};
