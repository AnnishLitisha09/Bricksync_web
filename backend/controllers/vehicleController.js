require("dotenv").config();
const db = require("../models");
const Vehicle = db.Vehicle;
const nodemailer = require("nodemailer");
const cron = require("node-cron");

/* Helper to map uploaded images */
const mapImages = (files, existingVehicle = {}) => ({
  vehicleImage: files?.vehicleImage ? "/images/" + files.vehicleImage[0].filename : existingVehicle.vehicleImage,
  rcImage: files?.rcImage ? "/images/" + files.rcImage[0].filename : existingVehicle.rcImage,
  insuranceImage: files?.insuranceImage ? "/images/" + files.insuranceImage[0].filename : existingVehicle.insuranceImage,
  pollutionImage: files?.pollutionImage ? "/images/" + files.pollutionImage[0].filename : existingVehicle.pollutionImage,
  speedImage: files?.speedImage ? "/images/" + files.speedImage[0].filename : existingVehicle.speedImage,
});

/* Check & update isActive based on dates */
const updateVehicleStatus = (vehicle) => {
  const today = new Date();
  if (
    (vehicle.insurance && new Date(vehicle.insurance) <= today) ||
    (vehicle.pollution && new Date(vehicle.pollution) <= today) ||
    (vehicle.rcDate && new Date(vehicle.rcDate) <= today)
  ) {
    vehicle.isActive = false;
  } else {
    vehicle.isActive = true;
  }
};

/* =========================
   ENHANCED EMAIL UI
========================= */
const sendExpiryEmail = async (vehicle, type) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const expiryDate = type === "Insurance" ? vehicle.insurance : type === "Pollution" ? vehicle.pollution : vehicle.rcDate;
    const formattedDate = new Date(expiryDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1e293b; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">Aswath Hollow Bricks</h1>
          <p style="color: #94a3b8; margin-top: 5px; font-size: 12px;">Vehicle Management System</p>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <div style="background-color: #fff1f2; color: #e11d48; display: inline-block; padding: 8px 16px; border-radius: 50px; font-size: 12px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase;">
            🚨 Document Expired
          </div>
          
          <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 24px;">${type} Expiry Alert</h2>
          <p style="color: #64748b; font-size: 16px; line-height: 1.5;">The ${type.toLowerCase()} for vehicle <strong style="color: #0f172a;">${vehicle.vehicleNumber}</strong> has reached its expiry date.</p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: left;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vehicle Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${vehicle.vehicleName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vehicle Number:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${vehicle.vehicleNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Expiry Date:</td>
                <td style="padding: 8px 0; color: #e11d48; font-weight: 600; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Current Status:</td>
                <td style="padding: 8px 0; color: #f59e0b; font-weight: 600; text-align: right;">Deactivated (Inactive)</td>
              </tr>
            </table>
          </div>

          <a href="https://www.aswath.online" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 10px;">Update Documents</a>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
            Aswath Hollow Bricks & Lorry Service <br> Tiruppur, Tamil Nadu
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Aswath Management" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🚨 EXPIRY ALERT: ${vehicle.vehicleNumber} (${type})`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`🚨 Professional Notification sent for ${vehicle.vehicleNumber} ${type}`);
  } catch (err) {
    console.error("EMAIL ERROR:", err);
  }
};

/* =========================
   CRON JOB - Daily Check
========================= */
cron.schedule("0 0 * * *", async () => {
  console.log("🔔 Running vehicle expiry check...");
  try {
    const vehicles = await Vehicle.findAll();
    const today = new Date();

    for (let vehicle of vehicles) {
      let changed = false;
      let alreadyInactive = !vehicle.isActive;

      // Check Insurance
      if (vehicle.insurance && new Date(vehicle.insurance) <= today && !alreadyInactive) {
        vehicle.isActive = false;
        await sendExpiryEmail(vehicle, "Insurance");
        changed = true;
      }
      // Check Pollution
      else if (vehicle.pollution && new Date(vehicle.pollution) <= today && !alreadyInactive) {
        vehicle.isActive = false;
        await sendExpiryEmail(vehicle, "Pollution");
        changed = true;
      }
      // Check RC
      else if (vehicle.rcDate && new Date(vehicle.rcDate) <= today && !alreadyInactive) {
        vehicle.isActive = false;
        await sendExpiryEmail(vehicle, "RC");
        changed = true;
      }

      if (changed) await vehicle.save();
    }
  } catch (error) {
    console.error("CRON JOB ERROR:", error);
  }
});

/* =========================
   CONTROLLER EXPORTS
========================= */
exports.createVehicle = async (req, res) => {
  try {
    const { vehicleName, vehicleNumber, insurance, pollution, rcDate, kilometer } = req.body || {};

    const vehicleData = {
      vehicleName,
      vehicleNumber,
      insurance: insurance ? new Date(insurance) : null,
      pollution: pollution ? new Date(pollution) : null,
      rcDate: rcDate ? new Date(rcDate) : null,
      kilometer: Number(kilometer) || 0,
      ...mapImages(req.files),
    };

    updateVehicleStatus(vehicleData);
    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json({ success: true, message: "Vehicle created successfully", data: vehicle });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ order: [["createdAt", "DESC"]] });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

    const images = mapImages(req.files, vehicle);
    const updatedData = { ...req.body, ...images };

    // Convert dates if provided
    if (updatedData.insurance) updatedData.insurance = new Date(updatedData.insurance);
    if (updatedData.pollution) updatedData.pollution = new Date(updatedData.pollution);
    if (updatedData.rcDate) updatedData.rcDate = new Date(updatedData.rcDate);

    await vehicle.update(updatedData);
    updateVehicleStatus(vehicle);
    await vehicle.save();

    return res.json({ success: true, message: "Vehicle updated successfully", data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update vehicle" });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const deleted = await Vehicle.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleVehicleStatus = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    vehicle.isActive = !vehicle.isActive;
    await vehicle.save();
    res.json({ message: "Vehicle status updated", isActive: vehicle.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};