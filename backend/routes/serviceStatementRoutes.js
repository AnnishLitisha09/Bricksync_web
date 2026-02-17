const router = require("express").Router();
const controller = require("../controllers/serviceStatementController");
const auth = require("../middleware/authMiddleware");

router.use(auth);

router.post("/", controller.createServiceStatement);
router.get("/", controller.getAllServiceStatements);
router.get("/:id", controller.getServiceStatementById);
router.delete("/:id", controller.deleteServiceStatement);

module.exports = router;
