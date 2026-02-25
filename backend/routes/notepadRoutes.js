const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const notepadController = require("../controllers/notepadController");

// Multer config for PDF storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "pdfs/");
    },
    filename: (req, file, cb) => {
        cb(null, `Notepad_${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDFs are allowed"), false);
        }
    }
});

router.post("/save", notepadController.saveNotepad);
router.post("/upload-pdf", upload.single("pdf"), notepadController.uploadPDF);
router.get("/all", notepadController.getAllNotepads);
router.get("/stats", notepadController.getNotepadStats);

module.exports = router;
