const https = require("https");
const { emitTelemetry } = require("./socket");
const { Gprs } = require("../models");

const EXTERNAL_API_URL = "https://api.fvts.in/webapi/reports/dashboard/homepage";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJwaWQiOiIxNTYzIiwicG5hbWUiOiJUQVJHRVQgTUFSVC0gR09MRCBYIiwic21zaWQiOiIwIiwiY2lkIjoiODY3MjkiLCJ1aWQiOiIxIiwidXR5cGUiOiJVIiwidW5hbWUiOiJBU1dBVEgiLCJ0aW1lem9uZSI6IjMzMCIsInBhbmVsaWQiOiIxIiwidmlld2lkIjoiMTAxIiwiZ3JvdXBpbmciOiIwIiwicGxhbmNvZGUiOiJTQyIsImZ1bGxuYW1lIjoiICIsImF1dGh0eXBlIjoiIiwiYXV0aGNvZGUiOiIwIiwiZm9yYXhlc3RyYWNrIjoiZmFsc2UiLCJsb2dvIjoiaHR0cHM6Ly9heGRvYy5zMy1hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vbG9nby9wcm92aWRlcnMvcDE1NjNfZXNtYXJ0XzE1NjMucG5nIiwibG9nb3RpdGxlIjoiU21hcnQgR3BzIiwiaGlzdG9yeWlkIjoiMjc4OTEzMTQiLCJwYXJlbnRwaWQiOiIxMTYiLCJtb2JpbGVsZW4iOiIxMCIsImhvbWVwYWdldmlldyI6IiIsInB3ZGV4cGlyZWRheXMiOiItNjMwIiwiY291bnRyeV9jb2RlIjoiIiwiZWxnX21hcHBlZCI6IjAiLCJhdXRvdXNlcmlkIjoiMTAxNjkzIiwidXBpdmVuZG9yaWQiOiIiLCJ2aWV3dHlwZSI6IkFkdmFuY2UiLCJsb2dpbmRhdGUiOiIyMDI2LzAzLzA1IDA0OjU4OjI2IiwiYXBwaWQiOiIwIiwid2ViaWQiOiIzIiwiY3Jvc3NfY29tcGFueSI6IjAiLCJqdGkiOiI2ZmY2ODc2OS0xYzJiLTQwYTQtYTVjZC03MWUwMWFkNjBhZTUiLCJleHAiOjE3ODgyMzg3MDZ9.xLWI8uzC3MkED8b2rIrZ2jCzOLKowv76Z0uPkgh5TsM";

const startTelemetryStream = () => {
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
