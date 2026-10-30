const router = require("express").Router();
const controller = require("../controllers/serviceStatementController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Strictly Admin Only (Role 1) - Protected Workshop Service Statements & Financial Settlements
router.use(auth);
router.use(role(1));

router.post("/", controller.createServiceStatement);
router.get("/", controller.getAllServiceStatements);
router.get("/:id", controller.getServiceStatementById);
router.delete("/:id", controller.deleteServiceStatement);

module.exports = router;
