const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getAllEmployees, createEmployee } = require("../controllers/employeeController");

router.get("/", verifyToken, getAllEmployees);
router.post("/", verifyToken, createEmployee);

module.exports = router;
