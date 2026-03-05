const { Gprs, User } = require("../models");
const https = require("https");

const EXTERNAL_API_URL = "https://api.fvts.in/webapi/reports/dashboard/homepage";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJwaWQiOiIxNTYzIiwicG5hbWUiOiJUQVJHRVQgTUFSVC0gR09MRCBYIiwic21zaWQiOiIwIiwiY2lkIjoiODY3MjkiLCJ1aWQiOiIxIiwidXR5cGUiOiJVIiwidW5hbWUiOiJBU1dBVEgiLCJ0aW1lem9uZSI6IjMzMCIsInBhbmVsaWQiOiIxIiwidmlld2lkIjoiMTAxIiwiZ3JvdXBpbmciOiIwIiwicGxhbmNvZGUiOiJTQyIsImZ1bGxuYW1lIjoiICIsImF1dGh0eXBlIjoiIiwiYXV0aGNvZGUiOiIwIiwiZm9yYXhlc3RyYWNrIjoiZmFsc2UiLCJsb2dvIjoiaHR0cHM6Ly9heGRvYy5zMy1hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vbG9nby9wcm92aWRlcnMvcDE1NjNfZXNtYXJ0XzE1NjMucG5nIiwibG9nb3RpdGxlIjoiU21hcnQgR3BzIiwiaGlzdG9yeWlkIjoiMjc4OTEzMTQiLCJwYXJlbnRwaWQiOiIxMTYiLCJtb2JpbGVsZW4iOiIxMCIsImhvbWVwYWdldmlldyI6IiIsInB3ZGV4cGlyZWRheXMiOiItNjMwIiwiY291bnRyeV9jb2RlIjoiIiwiZWxnX21hcHBlZCI6IjAiLCJhdXRvdXNlcmlkIjoiMTAxNjkzIiwidXBpdmVuZG9yaWQiOiIiLCJ2aWV3dHlwZSI6IkFkdmFuY2UiLCJsb2dpbmRhdGUiOiIyMDI2LzAzLzA1IDA0OjU4OjI2IiwiYXBwaWQiOiIwIiwid2ViaWQiOiIzIiwiY3Jvc3NfY29tcGFueSI6IjAiLCJqdGkiOiI2ZmY2ODc2OS0xYzJiLTQwYTQtYTVjZC03MWUwMWFkNjBhZTUiLCJleHAiOjE3ODgyMzg3MDZ9.xLWI8uzC3MkED8b2rIrZ2jCzOLKowv76Z0uPkgh5TsM";

exports.syncGprsData = async (req, res) => {
    try {
        const postData = JSON.stringify({ showrawdata: 1, panelid: 1 });

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "AuthToken": AUTH_TOKEN,
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36",
            },
        };

        const externalReq = https.request(EXTERNAL_API_URL, options, (externalRes) => {
            let data = "";
            externalRes.on("data", (chunk) => {
                data += chunk;
            });

            externalRes.on("end", async () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code === 1 && Array.isArray(result.data)) {
                        for (const vehicleData of result.data) {
                            await Gprs.upsert({
                                vehicleNumber: vehicleData.vehicle,
                                speed: vehicleData.speed,
                                // We keep existing driverName if it's already set locally, 
                                // but sync speed from external. 
                                // Or if we want to default it:
                                // driverName: vehicleData.driver 
                            }, {
                                fields: ['speed', 'lastSync'] // Only update speed and sync time if exists
                            });

                            // If not exists, it will create with default null driverName
                            const [record, created] = await Gprs.findOrCreate({
                                where: { vehicleNumber: vehicleData.vehicle },
                                defaults: {
                                    vehicleNumber: vehicleData.vehicle,
                                    speed: vehicleData.speed,
                                    driverName: vehicleData.driver || "Unassigned"
                                }
                            });

                            if (!created) {
                                await record.update({
                                    speed: vehicleData.speed,
                                    lastSync: new Date()
                                });
                            }
                        }
                        res.json({ message: "Sync successful", count: result.data.length });
                    } else {
                        res.status(500).json({ message: "External API error", detail: result.msg });
                    }
                } catch (err) {
                    res.status(500).json({ error: "Failed to parse external data: " + err.message });
                }
            });
        });

        externalReq.on("error", (err) => {
            res.status(500).json({ error: "External request failed: " + err.message });
        });

        externalReq.write(postData);
        externalReq.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getGprsSummary = async (req, res) => {
    try {
        const summary = await Gprs.findAll({
            order: [["vehicleNumber", "ASC"]],
        });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.assignDriver = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }
        const { vehicleNumber, driverName } = req.body;
        if (!vehicleNumber) {
            return res.status(400).json({ message: "Missing vehicleNumber" });
        }

        const [updated] = await Gprs.update(
            { driverName: driverName || null },
            { where: { vehicleNumber } }
        );

        if (!updated) {
            // Create if doesn't exist? Usually should exist from sync
            await Gprs.create({ vehicleNumber, driverName: driverName || null, speed: 0 });
        }

        res.json({ message: "Driver assigned successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
