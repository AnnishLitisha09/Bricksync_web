const express = require("express");
const router = express.Router();
const salaryController = require("../controllers/salaryController");

router.get("/loaders", salaryController.getLoaderSalaries);

module.exports = router;
