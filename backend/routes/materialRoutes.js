const express = require("express");
const router = express.Router();
const materialController = require("../controllers/materialController");

// Suppliers
router.post("/suppliers", materialController.createSupplier);
router.get("/suppliers", materialController.getAllSuppliers);
router.get("/suppliers/:id", materialController.getSupplierById);
router.put("/suppliers/:id", materialController.updateSupplier);
router.delete("/suppliers/:id", materialController.deleteSupplier);

// Entries
router.post("/entries", materialController.createMaterialEntry);
router.get("/entries/supplier/:supplierId", materialController.getEntriesBySupplier);
router.put("/entries/:id", materialController.updateMaterialEntry);
router.delete("/entries/:id", materialController.deleteMaterialEntry);

// Statements
router.post("/statements", materialController.createMaterialStatement);
router.get("/statements/supplier/:supplierId", materialController.getStatementsBySupplier);
router.put("/statements/:id", materialController.updateMaterialStatement);
router.delete("/statements/:id", materialController.deleteMaterialStatement);

module.exports = router;
