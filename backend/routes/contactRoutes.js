const router = require("express").Router();
const controller = require("../controllers/contactController");

router.post("/", controller.createContact);
router.get("/", controller.getContacts);
router.patch("/viewed/:id", controller.markViewed);

module.exports = router;
