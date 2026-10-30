const https = require("https");
const { emitTelemetry } = require("./socket");
const { Gprs } = require("../models");

const EXTERNAL_API_URL = "https://api.fvts.in/webapi/reports/dashboard/homepage";
const AUTH_TOKEN = process.env.FVTS_AUTH_TOKEN;

const startTelemetryStream = () => {
    if (!AUTH_TOKEN) {
        console.warn(
            "FVTS_AUTH_TOKEN is not configured. Telemetry streaming disabled."
        );
        return;
    }
    console.log("🚀 Starting Telemetry Streamer (10s interval)");

    setInterval(async () => {
        try {
            const postData = JSON.stringify({ showrawdata: 1, panelid: 1 });
            const options = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "AuthToken": AUTH_TOKEN,
                },
            };

            const req = https.request(EXTERNAL_API_URL, options, (res) => {
                let body = "";
                res.on("data", (chunk) => body += chunk);
                res.on("end", async () => {
                    try {
                        const result = JSON.parse(body);
                        if (result.code === 1 && Array.isArray(result.data)) {
                            // Fetch all local assignments once to avoid N+1 in memory
                            const localRecords = await Gprs.findAll();
                            const driverMap = localRecords.reduce((acc, rec) => {
                                acc[rec.vehicleNumber] = rec.driverName;
                                return acc;
                            }, {});

                            result.data.forEach(vehicle => {
                                const merged = {
                                    ...vehicle,
                                    assignedDriver: driverMap[vehicle.vehicle] || "Unassigned Identification"
                                };
                                emitTelemetry(vehicle.vehicle, merged);
                            });
                        }
                    } catch (e) {
                        // Silent fail for stream
                    }
                });
            });

            req.on("error", () => { });
            req.write(postData);
            req.end();
        } catch (err) {
            // console.error("Streamer Error:", err.message);
        }
    }, 10000); // 10 seconds
};

module.exports = { startTelemetryStream };
