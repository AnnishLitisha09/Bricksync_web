const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const os = require("os");

const app = express();
const db = require("./models");

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Static folder for uploaded images
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
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

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running on the network!");
});

// Function to get local network IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let name in interfaces) {
    for (let net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "0.0.0.0";
}

// Start server in network mode
const PORT = process.env.PORT || 3000;

db.sequelize.sync().then(() => {
  console.log("✅ Database connected");

  const localIP = getLocalIP();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Server running on network`);
    console.log(`👉 Local:    http://localhost:${PORT}`);
    console.log(`👉 Network:  http://${localIP}:${PORT}`);
  });
});
