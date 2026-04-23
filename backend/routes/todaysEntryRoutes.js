const express = require("express");
const router = express.Router();
const multer = require("multer");
const todaysEntryController = require("../controllers/todaysEntryController");

const upload = multer({ dest: "tmp/" });

router.post("/extract", upload.single("image"), todaysEntryController.extractEntry);

module.exports = router;
