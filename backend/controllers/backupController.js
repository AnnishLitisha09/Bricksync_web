const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const pkg = require("../package.json");
const sendEmail = require("../utils/sendEmail");

/* 🔹 Get App Version */
exports.getAppVersion = (req, res) => {
    res.json({ success: true, version: pkg.version });
};

/* 🔹 Trigger Backup */
exports.triggerBackup = (req, res) => {
    const dbName = process.env.DB_NAME || "bricksync";
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASS || "";
    const backupDir = path.join(__dirname, "../backups");

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const fileName = `backup-${Date.now()}.sql`;
    const filePath = path.join(backupDir, fileName);

    // Command construction
    let command = `mysqldump -u ${user} `;
    if (password) command += `-p${password} `;
    command += `${dbName} > "${filePath}"`;

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup Error: ${error.message}`);
            return res.status(500).json({ success: false, message: "Backup failed", error: error.message });
        }

        const stats = fs.statSync(filePath);

        try {
            // Send email to the requested address
            await sendEmail(
                "maswath55@gmail.com",
                "Bricksync Daily Backup - SQL Export",
                `<p>System Backup Generated: <b>${new Date().toLocaleString()}</b></p>
                 <p>File: <b>${fileName}</b></p>
                 <p>Size: <b>${(stats.size / 1024).toFixed(2)} KB</b></p>`,
                [{ filename: fileName, path: filePath }]
            );

            res.json({
                success: true,
                message: "Backup created and emailed successfully",
                data: {
                    fileName,
                    size: stats.size,
                    createdAt: new Date()
                }
            });
        } catch (emailErr) {
            console.error("Email Error:", emailErr);
            res.json({
                success: true,
                message: "Backup created, but email failed",
                data: { fileName, size: stats.size, createdAt: new Date() }
            });
        }
    });
};

/* 🔹 Get Last Backup Info */
exports.getBackupStatus = (req, res) => {
    const backupDir = path.join(__dirname, "../backups");

    if (!fs.existsSync(backupDir)) {
        return res.json({ success: true, data: null });
    }

    const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith(".sql"))
        .map(file => {
            const stats = fs.statSync(path.join(backupDir, file));
            return {
                fileName: file,
                size: stats.size,
                createdAt: stats.birthtime
            };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

    res.json({ success: true, data: files[0] || null });
};
