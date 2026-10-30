"use strict";

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
    getAllOffices,
    getOfficeById,
    createOffice,
    updateOffice,
    deleteOffice,
    restoreOffice,
    getOfficeSummary
} = require("../controllers/officeController");

router.use(verifyToken);

router.get("/", role(1, 2), getAllOffices);
router.get("/summary", role(1, 2), getOfficeSummary);
router.get("/:id", role(1, 2), getOfficeById);

// Admin-Only Store/Office Configurations
router.post("/", role(1), createOffice);
router.put("/:id", role(1), updateOffice);
router.delete("/:id", role(1), deleteOffice);
router.patch("/:id/restore", role(1), restoreOffice);

module.exports = router;
