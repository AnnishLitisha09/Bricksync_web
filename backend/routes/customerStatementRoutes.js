const express = require("express");
const router = express.Router();
const customerStatementController = require("../controllers/customerStatementController");

router.post("/", customerStatementController.createStatement);
router.get("/", customerStatementController.getAllStatements);
router.get("/customer/:cusId", customerStatementController.getStatementsByCustomer);
router.put("/:id", customerStatementController.updateStatement);
router.delete("/:id", customerStatementController.deleteStatement);

module.exports = router;
