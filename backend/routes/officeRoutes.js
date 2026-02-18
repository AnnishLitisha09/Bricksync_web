const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
    getAllOffices,
    getOfficeById,
    createOffice,
    updateOffice,
    deleteOffice,
    restoreOffice,
    getOfficeSummary
} = require("../controllers/officeController");

router.get("/", verifyToken, getAllOffices);
router.get("/summary", verifyToken, getOfficeSummary); // Dashboard stat
router.get("/:id", verifyToken, getOfficeById);
router.post("/", verifyToken, createOffice);
router.put("/:id", verifyToken, updateOffice);
router.delete("/:id", verifyToken, deleteOffice);
router.patch("/:id/restore", verifyToken, restoreOffice);

module.exports = router;
