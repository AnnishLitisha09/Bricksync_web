const { SparesTitle, SparesImage, Vehicle } = require("../models");

// Get all spares titles for a vehicle
exports.getVehicleSpares = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const queryOptions = {
      where: { vehicle_id },
      include: [{ model: SparesImage, as: "images" }],
      order: [["date", "DESC"]],
      distinct: true,
    };

    if (page) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
      const { count, rows } = await SparesTitle.findAndCountAll(queryOptions);
      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    }

    const spares = await SparesTitle.findAll(queryOptions);
    res.status(200).json({ success: true, data: spares });
  } catch (error) {
    console.error("Error fetching spares:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get all spares titles from all vehicles
exports.getAllSpares = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const queryOptions = {
      include: [
        { model: SparesImage, as: "images" },
        { model: Vehicle, as: "vehicle" }
      ],
      order: [["date", "DESC"]],
      distinct: true,
    };

    if (page) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
      const { count, rows } = await SparesTitle.findAndCountAll(queryOptions);
      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    }

    const spares = await SparesTitle.findAll(queryOptions);
    res.status(200).json({ success: true, data: spares });
  } catch (error) {
    console.error("Error fetching all spares:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.createSparesEntry = async (req, res) => {
  console.log("--- SPARES ENTRY DEBUG ---");
  console.log("Body:", req.body);
  console.log("Files:", req.files ? req.files.map(f => ({ fieldname: f.fieldname, name: f.originalname })) : "No files");
  
  try {
    const { vehicle_id, date, name, bill_amount } = req.body;
    const files = req.files || [];

    const title = await SparesTitle.create({
      vehicle_id: Number(vehicle_id),
      date,
      name,
      bill_amount: Number(bill_amount) || 0,
    });

    if (files.length > 0) {
      const imageRecords = files.map((file) => ({
        spares_title_id: title.id,
        image_url: `/images/${file.filename}`,
      }));
      await SparesImage.bulkCreate(imageRecords);
    }

    const fullData = await SparesTitle.findByPk(title.id, {
      include: [{ model: SparesImage, as: "images" }],
    });

    res.status(201).json({ success: true, data: fullData });
  } catch (error) {
    console.error("Error creating spares entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a spares entry
exports.deleteSparesEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await SparesImage.destroy({ where: { spares_title_id: id } });
    await SparesTitle.destroy({ where: { id } });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting spares entry:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
