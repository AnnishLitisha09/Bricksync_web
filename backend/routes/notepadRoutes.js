const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const notepadController = require("../controllers/notepadController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1)
router.use(authMiddleware);
router.use(roleMiddleware(1));

// All PDFs are stored inside backend/notepad only.
const uploadDir = path.resolve(__dirname, "../notepad");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = `${crypto.randomUUID()}.pdf`;
        cb(null, safeName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDFs are allowed"), false);
        }
    },
});

router.post("/save", notepadController.saveNotepad);
router.post("/upload-pdf", upload.single("pdf"), notepadController.uploadPDF);
router.get("/all", notepadController.getAllNotepads);
router.get("/stats", notepadController.getNotepadStats);

module.exports = router;
