const express = require("express");
const router = express.Router();
const sparesController = require("../controllers/sparesController");
const upload = require("../middleware/upload");

router.get("/", sparesController.getAllSpares);
router.get("/vehicle/:vehicle_id", sparesController.getVehicleSpares);
router.post("/", upload.any(), sparesController.createSparesEntry);
router.delete("/:id", sparesController.deleteSparesEntry);

module.exports = router;
