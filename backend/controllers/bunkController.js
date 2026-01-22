const db = require("../models");
const Bunk = db.Bunk;

// Create bunk
// controllers/bunkController.js
exports.createBunk = async (req, res) => {
  try {
    const { bunkName, ownerName, phoneNumber, address, amount } = req.body;

    if (!bunkName || !ownerName || !phoneNumber || !address) {
      return res.status(400).json({
        message: "bunkName, ownerName, phoneNumber and address are required",
      });
    }

    const bunk = await Bunk.create({
      bunkName,
      ownerName,
      phoneNumber,
      address,
      amount,
    });

    res.status(201).json(bunk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all bunks
exports.getAllBunks = async (req, res) => {
  try {
    const bunks = await Bunk.findAll({ order: [["createdAt", "DESC"]] });
    res.json(bunks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bunk by ID
exports.getBunkById = async (req, res) => {
  try {
    const bunk = await Bunk.findByPk(req.params.id);
    if (!bunk) return res.status(404).json({ message: "Bunk not found" });
    res.json(bunk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update bunk
exports.updateBunk = async (req, res) => {
  try {
    const [updated] = await Bunk.update(req.body, {
      where: { id: req.params.id },
    });

    if (!updated) return res.status(404).json({ message: "Bunk not found" });

    const updatedBunk = await Bunk.findByPk(req.params.id);
    res.json(updatedBunk);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete bunk
exports.deleteBunk = async (req, res) => {
  try {
    const deleted = await Bunk.destroy({
      where: { id: req.params.id },
    });

    if (!deleted) return res.status(404).json({ message: "Bunk not found" });

    res.json({ message: "Bunk deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
