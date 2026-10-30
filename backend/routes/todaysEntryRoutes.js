"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const todaysEntryController = require("../controllers/todaysEntryController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const upload = multer({ dest: "tmp/" });

// Strictly Admin Only (Role 1) - Protected Today's Entry Extraction
router.use(authMiddleware);
router.use(roleMiddleware(1));

router.post("/extract", upload.single("image"), todaysEntryController.extractEntry);

module.exports = router;
