const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const os = require("os");
const fs = require("fs");

const app = express();
const db = require("./models");
const { initScheduledTasks } = require("./utils/scheduler");

// Initialize Automated Tasks (Midnight Backups & Expiration Alerts)
initScheduledTasks();

// ================= Middleware =================
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-folder-name']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use("/images", express.static(path.join(__dirname, "images")));

// Custom static file serving for PDF folders to support .gz compression
app.use("/:folder", (req, res, next) => {
  const { folder } = req.params;
  if (folder !== 'invoices' && folder !== 'notepad') return next();

  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  let cleanFilename = req.path;
  if (cleanFilename.startsWith('/')) cleanFilename = cleanFilename.slice(1);
  if (!cleanFilename) return next();

  try {
    cleanFilename = decodeURIComponent(cleanFilename);
  } catch (e) { }

  const filePath = path.join(__dirname, folder, cleanFilename);
  const gzFilePath = filePath + ".gz";

  // Check database status for invoices
  if (folder === 'invoices') {
    const { Invoice } = require("./models");
    const { Op } = require("sequelize");

    // Robust lookup logic synchronized with invoiceController.js
    Invoice.findOne({
      where: {
        [Op.or]: [
          { filename: cleanFilename },
          { pdfPath: { [Op.like]: `%${cleanFilename}` } }
        ]
      },
      order: [['id', 'DESC']]
    })
      .then(async invoice => {
        // Fallback: parse invoiceId from filename if exact filename match fails
        if (!invoice) {
          try {
            const base = cleanFilename.replace(/^Invoice_/, '').replace(/\.pdf$/i, '');
            const invoiceId = base.replace(/-(\d{4})$/, '/$1');
            invoice = await Invoice.findOne({ where: { invoiceId }, order: [['id', 'DESC']] });
          } catch (e) { }
        }

        if (!invoice) {
          console.log(`🚫 [Access] Invoice not found in DB: ${cleanFilename}`);
          return res.status(404).send("Document not found in our records.");
        }

        let isActuallyActive = invoice.isActive;
        if (isActuallyActive && invoice.notifiedAt) {
          const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
          if (new Date(invoice.notifiedAt) < threeHoursAgo) {
            isActuallyActive = false;
            invoice.update({ isActive: false }).catch(() => { });
          }
        }

        if (!isActuallyActive) {
          console.log(`🚫 [Access] Denied for inactive invoice: ${invoice.invoiceId}`);
          return res.status(403).send("This link has expired or is no longer active.");
        }

        serveFile();
      })
      .catch(err => {
        console.error("❌ [Access] DB Error during check:", err.message);
        res.status(500).send("Internal Server Error during access check.");
      });
  } else {
    serveFile();
  }

  function serveFile() {
    if (fs.existsSync(gzFilePath)) {
      res.set('Content-Encoding', 'gzip');
      res.set('Content-Type', 'application/pdf');
      res.set('Vary', 'Accept-Encoding');
      return res.sendFile(gzFilePath);
    } else if (fs.existsSync(filePath)) {
      res.set('Content-Type', 'application/pdf');
      return res.sendFile(filePath);
    }
    next();
  }
});

app.use("/notepad", express.static(path.join(__dirname, "notepad")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

// --- Request Logging (for Routing Debug) ---
app.use((req, res, next) => {
  console.log(`📡 [Incoming] ${req.method} ${req.url}`);
  next();
});

// ================= Routes =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/vehicle-services", require("./routes/vehicleServiceRoutes"));
app.use("/api/bunks", require("./routes/bunkRoutes"));
app.use("/api/vehicle-fuels", require("./routes/vehicleFuelRoutes"));
app.use("/api/bunk-statements", require("./routes/bunkStatementRoutes"));
app.use("/api/driver", require("./routes/driver"));
app.use("/api/banks", require("./routes/bankRouters"));
app.use("/api/fuel-statements", require("./routes/fuelStatementRouters"));
app.use("/api/service-shops", require("./routes/serviceShopRouters"));
app.use("/api/service-statements", require("./routes/serviceStatementRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/offices", require("./routes/officeRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/production", require("./routes/productionRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/backup", require("./routes/backupRoutes"));
app.use("/api/ocr", require("./routes/ocrRoutes"));
app.use("/api/gprs", require("./routes/gprsRoutes"));

app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/customer-statements", require("./routes/customerStatementRoutes"));
console.log("🔌 Mounting /api/call-logs...");
app.use("/api/call-logs", require("./routes/callLogRoutes"));
app.use("/api/notepad", require("./routes/notepadRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));




// Default
app.get("/", (_, res) => {
  res.send("🚀 Backend running");
});

// ================= Server =================
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal)
        return net.address;
    }
  }
  return "0.0.0.0";
}

const PORT = process.env.PORT || 5000;

db.sequelize.authenticate()
  .then(() => {
    console.log("✅ DB Connected");

    const ip = getLocalIP();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`👉 Local: http://localhost:${PORT}`);
      console.log(`👉 Network: http://${ip}:${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ DB Connection Failed:", err);
  });
