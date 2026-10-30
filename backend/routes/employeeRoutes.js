"use strict";

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getAllEmployees, createEmployee } = require("../controllers/employeeController");

router.use(verifyToken);

router.get("/", role(1, 2), getAllEmployees);
router.post("/", role(1), createEmployee);

module.exports = router;
