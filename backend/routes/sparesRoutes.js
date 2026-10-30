"use strict";

const express = require("express");
const router = express.Router();
const sparesController = require("../controllers/sparesController");
const upload = require("../middleware/upload");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

router.use(auth);

router.get("/", role(1, 2), sparesController.getAllSpares);
router.get("/vehicle/:vehicle_id", role(1, 2), sparesController.getVehicleSpares);

// Admin-Only Spares Purchase Entries & Deletion
router.post("/", role(1), upload.any(), sparesController.createSparesEntry);
router.delete("/:id", role(1), sparesController.deleteSparesEntry);

module.exports = router;
