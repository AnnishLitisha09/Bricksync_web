const { Order, OrderItem, OrderEmployee, Customer, Office, Product, ProductStock, Vehicle, Employee, sequelize } = require("../models");

// Create an Order
exports.createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const {
            cus_id, date, transport_charge,
            items, // array of { product, office_id, material_id, quantity, price, vehicle_id, driver_ids, loader_ids }
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("At least one material item is required");
        }

        // 1. Create Order Header
        const newOrder = await Order.create({
            cus_id,
            transport_charge: transport_charge || 0,
            date,
        }, { transaction });

        let totalItemsValue = 0;

        // 2. Create Order Items, Employees & Reduce Stock
        for (const item of items) {
            const validMaterialId = (item.material_id && Number(item.material_id) > 0) ? Number(item.material_id) : null;
            const validOfficeId = (item.office_id && Number(item.office_id) > 0) ? Number(item.office_id) : null;

            const newItem = await OrderItem.create({
                order_id: newOrder.order_id,
                product: item.product || item.particulars,
                material_id: validMaterialId,
                office_id: validOfficeId,
                quantity: item.quantity || item.qty,
                price: item.price || item.rate,
                vehicle_id: (item.vehicle_id && Number(item.vehicle_id) > 0) ? Number(item.vehicle_id) : null,
            }, { transaction });

            // Handle item-level employees
            if (item.driver_ids && Array.isArray(item.driver_ids)) {
                const driverRecords = item.driver_ids
                    .filter(id => id)
                    .map(empId => ({ order_item_id: newItem.id, employee_id: empId, role: "driver" }));
                if (driverRecords.length > 0) await OrderEmployee.bulkCreate(driverRecords, { transaction });
            }

            if (item.loader_ids && Array.isArray(item.loader_ids)) {
                const loaderRecords = item.loader_ids
                    .filter(id => id)
                    .map(empId => ({ order_item_id: newItem.id, employee_id: empId, role: "loader" }));
                if (loaderRecords.length > 0) await OrderEmployee.bulkCreate(loaderRecords, { transaction });
            }

            totalItemsValue += (Number(item.quantity || item.qty) * Number(item.price || item.rate));

            // Reduce Stock
            if (validMaterialId && validOfficeId) {
                const stock = await ProductStock.findOne({
                    where: { product_id: validMaterialId, office_id: validOfficeId },
                    transaction
                });
                if (stock) {
                    if (Number(stock.quantity) < Number(item.quantity || item.qty)) {
                        throw new Error(`Insufficient stock for ${item.product || item.particulars}. Available: ${stock.quantity}`);
                    }
                    await stock.decrement("quantity", { by: (item.quantity || item.qty), transaction });
                } else {
                    throw new Error(`Stock record not found for ${item.product || item.particulars}`);
                }
            }
        }

        // 3. Update Customer Balance
        const totalOrderValue = totalItemsValue + (Number(transport_charge) || 0);
        const customer = await Customer.findByPk(cus_id, { transaction });
        if (customer) {
            await customer.increment("balance", { by: totalOrderValue, transaction });
        }


        await transaction.commit();
        return res.status(201).json({ message: "Order created successfully", data: newOrder });
    } catch (error) {
        await transaction.rollback();
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get all Orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { is_deleted: false },
            include: [
                { model: Customer, as: "customer" },
                {
                    model: OrderItem,
                    as: "items",
                    include: [
                        { model: Office, as: "office" },
                        { model: Product, as: "material" },
                        { model: Vehicle, as: "vehicle" },
                        {
                            model: OrderEmployee,
                            as: "orderEmployees",
                            include: [{ model: User, as: "employee" }]
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({ data: orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findOne({
            where: { order_id: id, is_deleted: false },
            include: [
                { model: Customer, as: "customer" },
                {
                    model: OrderItem,
                    as: "items",
                    include: [
                        { model: Office, as: "office" },
                        { model: Product, as: "material" },
                        { model: Vehicle, as: "vehicle" },
                        {
                            model: OrderEmployee,
                            as: "orderEmployees",
                            include: [{ model: User, as: "employee" }]
                        }
                    ]
                }
            ]
        });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({ data: order });
    } catch (error) {
        console.error("Error fetching order:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update an Order
exports.updateOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const {
            cus_id, date, transport_charge,
            items
        } = req.body;

        const order = await Order.findOne({
            where: { order_id: id, is_deleted: false },
            include: [{ model: OrderItem, as: "items" }]
        });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ message: "Order not found" });
        }

        // --- 1. Restore Stock for Old Items ---
        for (const oldItem of order.items) {
            if (oldItem.material_id && oldItem.office_id) {
                const stock = await ProductStock.findOne({
                    where: { product_id: oldItem.material_id, office_id: oldItem.office_id },
                    transaction
                });
                if (stock) await stock.increment("quantity", { by: oldItem.quantity, transaction });
            }
        }

        // --- 2. Calculate Balance Reversal ---
        const oldItemsValue = order.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
        const oldTotal = oldItemsValue + (Number(order.transport_charge) || 0);

        // --- 3. Destroy Old Items (Associations cascade via DB or we handle them) ---
        // Since we moved staff to items, and order_items have onDelete: CASCADE for order_employees,
        // destroying order items should clean up their employees.
        await OrderItem.destroy({ where: { order_id: id }, transaction });

        // --- 4. Create New Items & Reduce New Stock ---
        let newItemsValue = 0;
        for (const item of items) {
            const validMaterialId = (item.material_id && Number(item.material_id) > 0) ? Number(item.material_id) : null;
            const validOfficeId = (item.office_id && Number(item.office_id) > 0) ? Number(item.office_id) : null;

            const newItem = await OrderItem.create({
                order_id: id,
                product: item.product || item.particulars,
                material_id: validMaterialId,
                office_id: validOfficeId,
                quantity: item.quantity || item.qty,
                price: item.price || item.rate,
                vehicle_id: (item.vehicle_id && Number(item.vehicle_id) > 0) ? Number(item.vehicle_id) : null,
            }, { transaction });

            // Handle item-level employees
            if (item.driver_ids && Array.isArray(item.driver_ids)) {
                const driverRecords = item.driver_ids
                    .filter(id => id)
                    .map(empId => ({ order_item_id: newItem.id, employee_id: empId, role: "driver" }));
                if (driverRecords.length > 0) await OrderEmployee.bulkCreate(driverRecords, { transaction });
            }

            if (item.loader_ids && Array.isArray(item.loader_ids)) {
                const loaderRecords = item.loader_ids
                    .filter(id => id)
                    .map(empId => ({ order_item_id: newItem.id, employee_id: empId, role: "loader" }));
                if (loaderRecords.length > 0) await OrderEmployee.bulkCreate(loaderRecords, { transaction });
            }

            newItemsValue += (Number(item.quantity || item.qty) * Number(item.price || item.rate));

            if (validMaterialId && validOfficeId) {
                const stock = await ProductStock.findOne({
                    where: { product_id: validMaterialId, office_id: validOfficeId },
                    transaction
                });
                if (stock) {
                    if (Number(stock.quantity) < Number(item.quantity || item.qty)) {
                        throw new Error(`Insufficient stock for ${item.product || item.particulars}. Available: ${stock.quantity}`);
                    }
                    await stock.decrement("quantity", { by: (item.quantity || item.qty), transaction });
                } else {
                    throw new Error(`Stock record not found for ${item.product || item.particulars} at the selected office.`);
                }
            }
        }

        // --- 5. Update Header & Balance ---
        const newTotal = newItemsValue + (Number(transport_charge) || 0);
        const balanceDiff = newTotal - oldTotal;

        const customer = await Customer.findByPk(cus_id, { transaction });
        if (customer && balanceDiff !== 0) {
            await customer.increment("balance", { by: balanceDiff, transaction });
        }

        await order.update({
            cus_id,
            date,
            transport_charge: transport_charge || 0
        }, { transaction });


        await transaction.commit();
        return res.status(200).json({ message: "Order updated successfully", data: order });
    } catch (error) {
        await transaction.rollback();
        console.error("Error updating order:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete an Order (soft delete)
exports.deleteOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const order = await Order.findOne({
            where: { order_id: id, is_deleted: false },
            include: [{ model: OrderItem, as: "items" }]
        });
        if (!order) {
            await transaction.rollback();
            return res.status(404).json({ message: "Order not found" });
        }

        // --- 1. Restore Stock for all items ---
        for (const item of order.items) {
            if (item.material_id && item.office_id) {
                const stock = await ProductStock.findOne({
                    where: { product_id: item.material_id, office_id: item.office_id },
                    transaction
                });
                if (stock) await stock.increment("quantity", { by: item.quantity, transaction });
            }
        }

        // --- 2. Restore Customer Balance ---
        const itemsValue = order.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
        const totalValue = itemsValue + (Number(order.transport_charge) || 0);

        const customer = await Customer.findByPk(order.cus_id, { transaction });
        if (customer) {
            await customer.decrement("balance", { by: totalValue, transaction });
        }

        await order.update({ is_deleted: true, deleted_at: new Date() }, { transaction });

        await transaction.commit();
        return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        await transaction.rollback();
        console.error("Error deleting order:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Bulk Import Orders & Payments from parsed PDF
exports.bulkImportOrders = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { cus_id, orders = [], payments = [] } = req.body;

        if (!cus_id) {
            await transaction.rollback();
            return res.status(400).json({ message: "cus_id is required" });
        }

        let ordersCreated = 0;
        let paymentsCreated = 0;

        // 1. Create Orders
        for (const orderData of orders) {
            if (!orderData.items || orderData.items.length === 0) continue;

            // Convert DD-MM-YYYY -> YYYY-MM-DD
            const parts = (orderData.date || "").split("-");
            const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : orderData.date;

            const newOrder = await Order.create({
                cus_id: Number(cus_id),
                date: isoDate,
                transport_charge: 0,
            }, { transaction });

            let totalValue = 0;

            for (const item of orderData.items) {
                const qty = Number(item.qty) || 0;
                const rate = Number(item.rate) || 0;
                totalValue += qty * rate;

                await OrderItem.create({
                    order_id: newOrder.order_id,
                    product: item.product,
                    material_id: null,
                    office_id: null,
                    quantity: qty,
                    price: rate,
                    vehicle_id: null,
                }, { transaction });
            }

            const customer = await Customer.findByPk(cus_id, { transaction });
            if (customer) await customer.increment("balance", { by: totalValue, transaction });

            ordersCreated++;
        }

        // 2. Create Payments
        const { CustomerStatement } = require("../models");
        for (const payment of payments) {
            const amt = Number(payment.amount) || 0;
            if (amt <= 0) continue;

            const parts = (payment.date || "").split("-");
            const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : payment.date;

            await CustomerStatement.create({
                cus_id: Number(cus_id),
                amount: amt,
                bank_type: payment.method || "CASH",
                date: isoDate || null,
            }, { transaction });

            const customer = await Customer.findByPk(cus_id, { transaction });
            if (customer) await customer.decrement("balance", { by: amt, transaction });

            paymentsCreated++;
        }

        await transaction.commit();
        return res.status(201).json({
            message: "Bulk import successful",
            ordersCreated,
            paymentsCreated,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error in bulk import:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
