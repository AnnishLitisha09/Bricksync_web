const express = require("express");
const router = express.Router();

const {
  createServiceShop,
  getAllServiceShops,
  getServiceShopById,
  updateServiceShop,
  deleteServiceShop,
} = require("../controllers/serviceShopController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", createServiceShop);
router.get("/", getAllServiceShops);
router.get("/:id", getServiceShopById);
router.put("/:id", updateServiceShop);
router.delete("/:id", deleteServiceShop);

module.exports = router;
