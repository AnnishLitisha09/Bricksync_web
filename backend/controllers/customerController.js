const { Customer, Order, OrderItem, CustomerStatement, CallLog, Office, Vehicle, OrderEmployee, Employee, Product, User } = require("../models");

// Create a new Customer
exports.createCustomer = async (req, res) => {
    try {
        const { name, email, phone_no, address, balance, category } = req.body;
        const customer = await Customer.create({
            name,
            email,
            phone_no,
            address,
            balance,
            category
        });
        return res.status(201).json({ message: "Customer created successfully", data: customer });
    } catch (error) {
        console.error("Error creating customer:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const { Op } = require("sequelize");

// Get all Customers with search and pagination
exports.getAllCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 12, sortBy = "name", sortOrder = "ASC" } = req.query;
        const offset = (page - 1) * limit;

        const where = { is_deleted: false };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { phone_no: { [Op.like]: `%${search}%` } }
            ];
        }

        // Map frontend sort names to database columns
        const columnMap = {
            name: "name",
            amount: "balance",
            created_at: "created_at"
        };
        const orderColumn = columnMap[sortBy] || "name";
        const orderDir = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

        const { count, rows } = await Customer.findAndCountAll({
            where,
            include: [
                {
                    model: CallLog,
                    as: "callLogs",
                    where: { is_deleted: false, is_called: true },
                    required: false,
                    limit: 1,
                    order: [["date", "DESC"]]
                }
            ],
            order: [[orderColumn, orderDir]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        const dataWithLastCall = rows.map(customer => {
            const raw = customer.toJSON();
            raw.last_called_date = raw.callLogs && raw.callLogs.length > 0 ? raw.callLogs[0].date : null;
            delete raw.callLogs;
            return raw;
        });

        return res.status(200).json({
            data: dataWithLastCall,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const { office_id } = req.query;

        const orderWhere = { is_deleted: false };
        if (office_id) orderWhere.office_id = office_id;

        const customerResult = await Customer.findOne({
            where: { id, is_deleted: false },
            include: [
                {
                    model: Order,
                    as: "orders",
                    where: orderWhere,
                    required: false,
                    include: [
                        {
                            model: OrderItem,
                            as: "items",
                            include: [
                                { model: Office, as: "office", where: { is_deleted: false }, required: false },
                                { model: Product, as: "material", where: { is_deleted: false }, required: false },
                                { model: Vehicle, as: "vehicle", required: false },
                                {
                                    model: OrderEmployee,
                                    as: "orderEmployees",
                                    include: [{
                                        model: User,
                                        as: "employee",
                                        where: { isDeleted: false },
                                        required: false
                                    }]
                                }
                            ]
                        },
                    ]
                },
                {
                    model: CustomerStatement,
                    as: "statements",
                    where: { is_deleted: false },
                    required: false
                },
                {
                    model: CallLog,
                    as: "callLogs",
                    where: { is_deleted: false },
                    required: false
                }
            ],
            order: [
                [{ model: Order, as: "orders" }, "date", "DESC"],
                [{ model: CustomerStatement, as: "statements" }, "date", "DESC"]
            ]
        });

        if (!customerResult) {
            return res.status(404).json({ message: "Customer not found" });
        }

        // Format orders to include explicit drivers and loaders for the frontend
        const customer = customerResult.toJSON();
        if (customer.orders) {
            customer.orders = customer.orders.map(order => {
                const drivers = (order.orderEmployees || [])
                    .filter(oe => oe.role === "driver" && oe.employee)
                    .map(oe => ({
                        employee_id: oe.employee.employee_id,
                        employee_name: oe.employee.employee_name,
                        staff_role: "Driver"
                    }));
                const loaders = (order.orderEmployees || [])
                    .filter(oe => oe.role === "loader" && oe.employee)
                    .map(oe => ({
                        employee_id: oe.employee.employee_id,
                        employee_name: oe.employee.employee_name,
                        staff_role: "Loader"
                    }));
                return {
                    ...order,
                    drivers,
                    loaders
                };
            });
        }

        return res.status(200).json({ data: customer });
    } catch (error) {
        console.error("Error fetching customer:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_no, address, balance, category } = req.body;

        const customer = await Customer.findOne({ where: { id, is_deleted: false } });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        await customer.update({ name, email, phone_no, address, balance, category });
        return res.status(200).json({ message: "Customer updated successfully", data: customer });
    } catch (error) {
        console.error("Error updating customer:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Delete a customer (soft delete)
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findOne({ where: { id, is_deleted: false } });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        await customer.update({ is_deleted: true, deleted_at: new Date() });
        return res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Bulk create customers
exports.bulkCreateCustomers = async (req, res) => {
    try {
        const { customers } = req.body;
        if (!customers || !Array.isArray(customers)) {
            return res.status(400).json({ message: "Invalid customers data" });
        }

        const createdCustomers = await Customer.bulkCreate(customers, {
            ignoreDuplicates: true
        });

        return res.status(201).json({
            message: `${createdCustomers.length} customers imported successfully`,
            data: createdCustomers
        });
    } catch (error) {
        console.error("Error bulk creating customers:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
