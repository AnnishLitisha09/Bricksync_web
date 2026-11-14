"use strict";

const {
  Cursor,
  CursorProduct,
  CursorLoad,
  CursorPayment,
  BranchDeliveryLog,
  Office,
  Product,
  ProductStock,
  Vehicle,
  Employee,
  Customer,
  BankTable,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { ensureCursorAndBranchTables } = require("../utils/schemaSync");

/**
 * Executes a database action with automatic schema self-healing
 * if tables or columns have not yet been migrated.
 */
async function withSchemaHealing(fn) {
  try {
    return await fn();
  } catch (error) {
    if (
      error &&
      error.message &&
      (error.message.includes("doesn't exist") ||
        error.message.includes("ER_NO_SUCH_TABLE") ||
        error.message.includes("Unknown column"))
    ) {
      console.warn("⚠️ [Schema Healing] Missing database entity detected. Executing auto-migration...");
      await ensureCursorAndBranchTables(sequelize);
      return await fn();
    }
    throw error;
  }
}

/* =========================================================================
   CURSOR CRUD
   ========================================================================= */

// Get all cursors with summary counts
exports.getAllCursors = async (req, res) => {
  try {
    const cursors = await withSchemaHealing(() =>
      Cursor.findAll({
        where: { is_deleted: false },
        include: [
          {
            model: CursorProduct,
            as: "products",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: CursorLoad,
            as: "loads",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: CursorPayment,
            as: "payments",
            where: { is_deleted: false },
            required: false,
          },
        ],
        order: [["id", "DESC"]],
      })
    );

    const data = cursors.map((c) => {
      const allLoads = c.loads || [];
      const loadedLoads = allLoads.filter(
        (l) => l.status === "loaded" && Number(l.remaining_qty) > 0
      );
      const deliveredLoads = allLoads.filter((l) => l.status === "delivered");
      const productsList = (c.products || []).map((p) => ({
        id: p.id,
        cursor_id: p.cursor_id,
        product_name: p.product_name,
        category: p.category,
        product_id: p.product_id,
        createdAt: p.createdAt,
      }));

      // Calculate total procurement amount (Loads)
      const totalProcurementAmount = allLoads.reduce((sum, l) => {
        const itemTotal = Number(l.qty || 0) * Number(l.price_per_qty || 0);
        const loadCharge = l.has_loading_charge
          ? Number(l.qty || 0) * Number(l.loading_charge_per_unit || 0)
          : 0;
        return sum + itemTotal + loadCharge;
      }, 0);

      // Calculate total payments made
      const allPayments = c.payments || [];
      const totalPaidAmount = allPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0
      );
      const balance = totalProcurementAmount - totalPaidAmount;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        location: c.location,
        notes: c.notes,
        createdAt: c.createdAt,
        productsCount: productsList.length,
        products: productsList,
        totalLoadsCount: allLoads.length,
        activeLoadedCount: loadedLoads.length,
        deliveredCount: deliveredLoads.length,
        activeLoadedQty: loadedLoads.reduce(
          (sum, l) => sum + Number(l.remaining_qty || 0),
          0
        ),
        totalProcurementAmount,
        totalPaidAmount,
        balance,
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching cursors:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single cursor with details
exports.getCursorById = async (req, res) => {
  try {
    const { id } = req.params;
    const cursor = await withSchemaHealing(() =>
      Cursor.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: CursorProduct,
            as: "products",
            where: { is_deleted: false },
            required: false,
          },
          {
            model: CursorLoad,
            as: "loads",
            where: { is_deleted: false },
            required: false,
            include: [
              {
                model: Vehicle,
                as: "vehicle",
                attributes: ["id", "vehicleName", "vehicleNumber"],
                required: false,
              },
              {
                model: Employee,
                as: "driver",
                attributes: ["employee_id", "employee_name"],
                required: false,
              },
            ],
          },
          {
            model: CursorPayment,
            as: "payments",
            where: { is_deleted: false },
            required: false,
            include: [
              {
                model: BankTable,
                as: "bank",
                attributes: ["id", "name", "accountNumber"],
                required: false,
              },
            ],
          },
        ],
        order: [
          [{ model: CursorProduct, as: "products" }, "id", "DESC"],
          [{ model: CursorLoad, as: "loads" }, "date", "DESC"],
          [{ model: CursorLoad, as: "loads" }, "id", "DESC"],
          [{ model: CursorPayment, as: "payments" }, "date", "DESC"],
          [{ model: CursorPayment, as: "payments" }, "id", "DESC"],
        ],
      })
    );

    if (!cursor) {
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    const c = cursor;
    const allLoads = c.loads || [];
    const allPayments = c.payments || [];
    const productsList = (c.products || []).map((p) => ({
      id: p.id,
      cursor_id: p.cursor_id,
      product_name: p.product_name,
      category: p.category,
      product_id: p.product_id,
      createdAt: p.createdAt,
    }));

    const totalProcurementAmount = allLoads.reduce((sum, l) => {
      const itemTotal = Number(l.qty || 0) * Number(l.price_per_qty || 0);
      const loadCharge = l.has_loading_charge
        ? Number(l.qty || 0) * Number(l.loading_charge_per_unit || 0)
        : 0;
      return sum + itemTotal + loadCharge;
    }, 0);

    const totalPaidAmount = allPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );
    const balance = totalProcurementAmount - totalPaidAmount;

    return res.json({
      success: true,
      data: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        location: c.location,
        notes: c.notes,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        products: productsList,
        loads: allLoads,
        payments: allPayments,
        totalProcurementAmount,
        totalPaidAmount,
        balance,
        productsCount: productsList.length,
        totalLoadsCount: allLoads.length,
        totalPaymentsCount: allPayments.length,
      },
    });
  } catch (error) {
    console.error("Error fetching cursor by id:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new cursor
exports.createCursor = async (req, res) => {
  try {
    const { name, phone, location, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Cursor name is required" });
    }

    const cursor = await withSchemaHealing(() =>
      Cursor.create({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        location: location ? location.trim() : null,
        notes: notes ? notes.trim() : null,
      })
    );

    return res.status(201).json({ success: true, data: cursor });
  } catch (error) {
    console.error("Error creating cursor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update cursor
exports.updateCursor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, location, notes } = req.body;

    const cursor = await Cursor.findOne({ where: { id, is_deleted: false } });
    if (!cursor) {
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    await cursor.update({
      name: name !== undefined ? name.trim() : cursor.name,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : cursor.phone,
      location: location !== undefined ? (location ? location.trim() : null) : cursor.location,
      notes: notes !== undefined ? (notes ? notes.trim() : null) : cursor.notes,
    });

    return res.json({ success: true, data: cursor });
  } catch (error) {
    console.error("Error updating cursor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete cursor
exports.deleteCursor = async (req, res) => {
  try {
    const { id } = req.params;
    const cursor = await Cursor.findOne({ where: { id, is_deleted: false } });
    if (!cursor) {
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    await cursor.update({ is_deleted: true });
    return res.json({ success: true, message: "Cursor deleted successfully" });
  } catch (error) {
    console.error("Error deleting cursor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   CURSOR PRODUCTS
   ========================================================================= */

// Add product to cursor (product name and category alone)
exports.addProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: "Category is required" });
    }

    const cursor = await Cursor.findOne({ where: { id, is_deleted: false } });
    if (!cursor) {
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    // Try to find matching master product in products table to maintain link
    const cleanCategory = category.toLowerCase().trim();
    const validCategory = ["sand", "cement", "bricks"].includes(cleanCategory)
      ? cleanCategory === "brick"
        ? "bricks"
        : cleanCategory
      : "sand";

    let masterProduct = await Product.findOne({
      where: {
        product_name: product_name.trim(),
        is_deleted: false,
      },
    });

    if (!masterProduct) {
      try {
        masterProduct = await Product.create({
          product_name: product_name.trim(),
          category: validCategory,
          price_per_stock: 0.0,
        });
      } catch (_) {}
    }

    const product = await CursorProduct.create({
      cursor_id: cursor.id,
      product_name: product_name.trim(),
      category: cleanCategory,
      product_id: masterProduct ? masterProduct.product_id : null,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("Error adding product to cursor:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product from cursor
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await CursorProduct.findOne({
      where: { id: productId, is_deleted: false },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await product.update({ is_deleted: true });
    return res.json({ success: true, message: "Product removed from cursor" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   CURSOR LOADING (VEHICLE LOADS)
   ========================================================================= */

// Record loading at cursor
exports.createLoad = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cursor_product_id,
      product_name,
      category,
      vehicle_id,
      vehicle_number,
      driver_id,
      driver_name,
      qty,
      price_per_qty,
      has_loading_charge,
      loading_charge_per_unit,
      customer_id,
      customer_name,
      date,
      notes,
    } = req.body;

    const cursor = await Cursor.findOne({ where: { id, is_deleted: false } });
    if (!cursor) {
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }
    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ success: false, message: "Vehicle number is required" });
    }
    if (!driver_name || !driver_name.trim()) {
      return res.status(400).json({ success: false, message: "Driver name is required" });
    }
    if (!qty || Number(qty) <= 0) {
      return res.status(400).json({ success: false, message: "Valid quantity is required" });
    }
    if (price_per_qty === undefined || Number(price_per_qty) < 0) {
      return res.status(400).json({ success: false, message: "Valid price per quantity is required" });
    }

    // Find product_id
    let productId = null;
    if (cursor_product_id) {
      const cp = await CursorProduct.findByPk(cursor_product_id);
      if (cp && cp.product_id) productId = cp.product_id;
    }
    if (!productId) {
      const p = await Product.findOne({
        where: { product_name: product_name.trim(), is_deleted: false },
      });
      if (p) productId = p.product_id;
    }

    const loadDate = date || new Date().toISOString().split("T")[0];

    const load = await CursorLoad.create({
      cursor_id: cursor.id,
      cursor_product_id: cursor_product_id ? Number(cursor_product_id) : null,
      product_name: product_name.trim(),
      category: category ? category.trim() : null,
      product_id: productId,
      vehicle_id: vehicle_id ? Number(vehicle_id) : null,
      vehicle_number: vehicle_number.trim(),
      driver_id: driver_id ? Number(driver_id) : null,
      driver_name: driver_name.trim(),
      qty: Number(qty),
      remaining_qty: Number(qty),
      price_per_qty: Number(price_per_qty),
      has_loading_charge: Boolean(has_loading_charge),
      loading_charge_per_unit: has_loading_charge ? Number(loading_charge_per_unit || 0) : 0,
      customer_name: customer_name ? customer_name.trim() : null,
      customer_id: customer_id ? Number(customer_id) : null,
      date: loadDate,
      status: "loaded",
      notes: notes ? notes.trim() : null,
    });

    return res.status(201).json({ success: true, data: load });
  } catch (error) {
    console.error("Error creating load:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all loads where status is "loaded" (for dropdown in /customer/add-material/new)
exports.getLoadedMaterials = async (req, res) => {
  try {
    const loads = await withSchemaHealing(() =>
      CursorLoad.findAll({
        where: {
          is_deleted: false,
          status: "loaded",
          remaining_qty: { [Op.gt]: 0 },
        },
        include: [
          {
            model: Cursor,
            as: "cursor",
            attributes: ["id", "name", "location", "phone"],
            where: { is_deleted: false },
          },
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["id", "vehicleName", "vehicleNumber"],
            required: false,
          },
          {
            model: Employee,
            as: "driver",
            attributes: ["employee_id", "employee_name"],
            required: false,
          },
        ],
        order: [["date", "DESC"], ["id", "DESC"]],
      })
    );

    return res.json({ success: true, data: loads });
  } catch (error) {
    console.error("Error fetching loaded materials:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all loads with optional filters
exports.getAllLoads = async (req, res) => {
  try {
    const { cursor_id, status } = req.query;
    const where = { is_deleted: false };
    if (cursor_id) where.cursor_id = cursor_id;
    if (status) where.status = status;

    const loads = await withSchemaHealing(() =>
      CursorLoad.findAll({
        where,
        include: [
          {
            model: Cursor,
            as: "cursor",
            attributes: ["id", "name", "location"],
          },
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["id", "vehicleName", "vehicleNumber"],
            required: false,
          },
          {
            model: Employee,
            as: "driver",
            attributes: ["employee_id", "employee_name"],
            required: false,
          },
        ],
        order: [["date", "DESC"], ["id", "DESC"]],
      })
    );

    return res.json({ success: true, data: loads });
  } catch (error) {
    console.error("Error fetching loads:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update load status / remaining qty
exports.updateLoadStatus = async (req, res) => {
  try {
    const { loadId } = req.params;
    const { status, remaining_qty, notes } = req.body;

    const load = await CursorLoad.findOne({
      where: { id: loadId, is_deleted: false },
    });
    if (!load) {
      return res.status(404).json({ success: false, message: "Load not found" });
    }

    const updates = {};
    if (status) updates.status = status;
    if (remaining_qty !== undefined) updates.remaining_qty = Number(remaining_qty);
    if (notes !== undefined) updates.notes = notes;

    await load.update(updates);
    return res.json({ success: true, data: load });
  } catch (error) {
    console.error("Error updating load status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete load
exports.deleteLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await CursorLoad.findOne({
      where: { id: loadId, is_deleted: false },
    });
    if (!load) {
      return res.status(404).json({ success: false, message: "Load not found" });
    }

    await load.update({ is_deleted: true });
    return res.json({ success: true, message: "Load deleted successfully" });
  } catch (error) {
    console.error("Error deleting load:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   BRANCH (OFFICE) DELIVERY & STOCK LOGS
   ========================================================================= */

// Record delivery to branch/office and increment ProductStock
exports.createBranchDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      office_id,
      cursor_load_id,
      product_name,
      category,
      product_id,
      quantity,
      price,
      vehicle_id,
      vehicle_number,
      driver_name,
      date,
      notes,
    } = req.body;

    if (!office_id) {
      throw new Error("Office/Branch is required");
    }
    if (!product_name) {
      throw new Error("Product name is required");
    }
    if (!quantity || Number(quantity) <= 0) {
      throw new Error("Valid quantity is required");
    }

    const office = await Office.findByPk(office_id, { transaction });
    if (!office) {
      throw new Error("Office not found");
    }

    // 1. If cursor_load_id is provided, deduct from CursorLoad
    let cursorLoad = null;
    if (cursor_load_id) {
      cursorLoad = await CursorLoad.findByPk(cursor_load_id, { transaction });
      if (cursorLoad) {
        const newRem = Math.max(0, Number(cursorLoad.remaining_qty) - Number(quantity));
        cursorLoad.remaining_qty = newRem;
        if (newRem <= 0) {
          cursorLoad.status = "delivered";
        }
        await cursorLoad.save({ transaction });
      }
    }

    // 2. Ensure product exists in products table for stock linkage
    let targetProductId = product_id ? Number(product_id) : null;
    if (!targetProductId) {
      let masterProd = await Product.findOne({
        where: { product_name: product_name.trim(), is_deleted: false },
        transaction,
      });
      if (!masterProd) {
        const cat = category && ["sand", "cement", "bricks"].includes(category.toLowerCase())
          ? category.toLowerCase() === "brick"
            ? "bricks"
            : category.toLowerCase()
          : "sand";
        masterProd = await Product.create(
          {
            product_name: product_name.trim(),
            category: cat,
            price_per_stock: Number(price) || 0,
          },
          { transaction }
        );
      }
      targetProductId = masterProd.product_id;
    }

    // 3. Increment or Create ProductStock in this Branch
    let stock = await ProductStock.findOne({
      where: { office_id: Number(office_id), product_id: targetProductId },
      transaction,
    });
    if (stock) {
      await stock.increment("quantity", { by: Number(quantity), transaction });
    } else {
      stock = await ProductStock.create(
        {
          office_id: Number(office_id),
          product_id: targetProductId,
          quantity: Number(quantity),
        },
        { transaction }
      );
    }

    // 4. Create BranchDeliveryLog
    const deliveryDate = date || new Date().toISOString().split("T")[0];
    const log = await BranchDeliveryLog.create(
      {
        office_id: Number(office_id),
        cursor_load_id: cursor_load_id ? Number(cursor_load_id) : null,
        product_name: product_name.trim(),
        category: category || null,
        product_id: targetProductId,
        quantity: Number(quantity),
        price: Number(price) || 0,
        vehicle_id: vehicle_id ? Number(vehicle_id) : (cursorLoad?.vehicle_id || null),
        vehicle_number: vehicle_number || cursorLoad?.vehicle_number || "",
        driver_name: driver_name || cursorLoad?.driver_name || "",
        date: deliveryDate,
        is_added_to_stock: true,
        notes: notes || null,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: "Delivered to branch and added to stock successfully",
      data: log,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating branch delivery:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get branch delivery logs for an office
exports.getBranchDeliveries = async (req, res) => {
  try {
    const { officeId } = req.params;
    const where = { is_deleted: false };
    if (officeId && officeId !== "all") {
      where.office_id = Number(officeId);
    }

    const logs = await BranchDeliveryLog.findAll({
      where,
      include: [
        {
          model: Office,
          as: "office",
          attributes: ["office_id", "office_name", "location"],
        },
        {
          model: CursorLoad,
          as: "cursorLoad",
          attributes: ["id", "cursor_id", "price_per_qty", "date"],
          include: [
            {
              model: Cursor,
              as: "cursor",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["product_id", "product_name", "category"],
        },
      ],
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error fetching branch deliveries:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Manually add / re-sync a branch delivery to stock
exports.addBranchDeliveryToStock = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const log = await BranchDeliveryLog.findOne({
      where: { id, is_deleted: false },
      transaction,
    });

    if (!log) {
      throw new Error("Delivery log not found");
    }

    if (!log.product_id) {
      const p = await Product.findOne({
        where: { product_name: log.product_name, is_deleted: false },
        transaction,
      });
      if (p) log.product_id = p.product_id;
    }

    if (log.product_id) {
      let stock = await ProductStock.findOne({
        where: { office_id: log.office_id, product_id: log.product_id },
        transaction,
      });

      if (stock) {
        await stock.increment("quantity", { by: Number(log.quantity), transaction });
      } else {
        await ProductStock.create(
          {
            office_id: log.office_id,
            product_id: log.product_id,
            quantity: Number(log.quantity),
          },
          { transaction }
        );
      }
    }

    await log.update({ is_added_to_stock: true }, { transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: `Added ${log.quantity} units to branch stock`,
      data: log,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error adding delivery to stock:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   CURSOR PAYMENTS
   ========================================================================= */

// Record payment to cursor
exports.createPayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { amount, bank_id, payment_mode, date, description } = req.body;

    if (!amount || Number(amount) <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Valid payment amount is required" });
    }

    const cursor = await Cursor.findOne({
      where: { id, is_deleted: false },
      transaction: t,
    });
    if (!cursor) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Cursor not found" });
    }

    let parsedBankId = bank_id ? Number(bank_id) : null;
    if (parsedBankId) {
      const bank = await BankTable.findByPk(parsedBankId, { transaction: t });
      if (bank) {
        await bank.decrement("amount", { by: Number(amount), transaction: t });
      }
    }

    const paymentDate = date || new Date().toISOString().split("T")[0];

    const payment = await CursorPayment.create(
      {
        cursor_id: cursor.id,
        bank_id: parsedBankId,
        amount: Number(amount),
        payment_mode: payment_mode || "BANK TRANSFER",
        date: paymentDate,
        description: description ? description.trim() : null,
      },
      { transaction: t }
    );

    await t.commit();

    const createdPayment = await CursorPayment.findByPk(payment.id, {
      include: [{ model: BankTable, as: "bank", attributes: ["id", "name", "accountNumber"] }],
    });

    return res.status(201).json({ success: true, data: createdPayment });
  } catch (error) {
    await t.rollback();
    console.error("Error creating cursor payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get payments for a cursor
exports.getCursorPayments = async (req, res) => {
  try {
    const { id } = req.params;
    const payments = await withSchemaHealing(() =>
      CursorPayment.findAll({
        where: { cursor_id: id, is_deleted: false },
        include: [{ model: BankTable, as: "bank", attributes: ["id", "name", "accountNumber"] }],
        order: [["date", "DESC"], ["id", "DESC"]],
      })
    );
    return res.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error fetching cursor payments:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete payment
exports.deletePayment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const payment = await CursorPayment.findOne({
      where: { id: paymentId, is_deleted: false },
      transaction: t,
    });
    if (!payment) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Restore bank amount
    if (payment.bank_id) {
      const bank = await BankTable.findByPk(payment.bank_id, { transaction: t });
      if (bank) {
        await bank.increment("amount", { by: Number(payment.amount), transaction: t });
      }
    }

    await payment.update({ is_deleted: true }, { transaction: t });
    await t.commit();

    return res.json({ success: true, message: "Payment removed successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting cursor payment:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
