const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const ocrController = require("../controllers/ocrController");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "tmp/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

router.post("/extract", upload.single("image"), ocrController.extractData);
router.post("/extract-trips", upload.single("image"), ocrController.extractDriverTrips);

module.exports = router;
