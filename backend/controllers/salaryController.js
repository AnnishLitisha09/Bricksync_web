const {
    OrderEmployee,
    OrderItem,
    Order,
    User,
    ProductionLog,
    ProductionEmployee,
    Attendance,
    GlobalSetting,
    sequelize
} = require("../models");
const { Op } = require("sequelize");

exports.getGlobalSettings = async (req, res) => {
    try {
        const settings = await GlobalSetting.findAll();
        const settingsMap = (settings || []).reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        return res.status(200).json({ success: true, settings: settingsMap });
    } catch (error) {
        console.error("Error fetching global settings:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateGlobalSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        let setting = await GlobalSetting.findOne({ where: { key } });
        if (setting) {
            setting.value = String(value);
            await setting.save();
        } else {
            setting = await GlobalSetting.create({ key, value: String(value) });
        }

        return res.status(200).json({ success: true, message: `Setting ${key} updated` });
    } catch (error) {
        console.error("Error updating global setting:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getWeeklySalaryOverview = async (req, res) => {
    try {
        const now = new Date();
        let startOfWeek;
        let endOfWeek;

        if (req.query.start || req.query.startDate) {
            startOfWeek = new Date(req.query.start || req.query.startDate);
            startOfWeek.setHours(0, 0, 0, 0);
        } else {
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);
        }

        if (req.query.end || req.query.endDate) {
            endOfWeek = new Date(req.query.end || req.query.endDate);
            endOfWeek.setHours(23, 59, 59, 999);
        } else {
            endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);
        }

        const formatDateStr = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const startOfWeekStr = formatDateStr(startOfWeek);
        const endOfWeekStr = formatDateStr(endOfWeek);

        // Fetch Global Driver Rate
        let driverRate = 750;
        try {
            const rateSetting = await GlobalSetting.findOne({ where: { key: "driver_daily_rate" } });
            if (rateSetting && !isNaN(parseFloat(rateSetting.value))) {
                driverRate = parseFloat(rateSetting.value);
            }
        } catch (e) {
            console.warn("Could not fetch driver_daily_rate from GlobalSetting, using default 750:", e.message);
        }

        // Fetch all Staff (userRole: 2) with staffRole
        let staff = [];
        try {
            staff = await User.findAll({
                where: { userRole: 2, isDeleted: false },
                attributes: ["userid", "name", "phoneNumber", "staffRole"]
            });
        } catch (e) {
            console.error("Error fetching staff users in weekly-overview:", e.message);
            staff = [];
        }

        // 1. Fetch Orders (Loader & Driver info)
        let allOrderStaff = [];
        try {
            allOrderStaff = await OrderEmployee.findAll({
                include: [{
                    model: OrderItem,
                    as: "orderItem",
                    required: false,
                    include: [{
                        model: Order,
                        as: "order",
                        required: false,
                        where: {
                            is_deleted: false,
                            date: { [Op.between]: [startOfWeekStr, endOfWeekStr] }
                        }
                    }, {
                        model: OrderEmployee,
                        as: "orderEmployees",
                        required: false
                    }]
                }]
            });
        } catch (e) {
            console.warn("Could not fetch OrderEmployees for weekly salary overview:", e.message);
            allOrderStaff = [];
        }

        // 2. Fetch Attendance (as Driver)
        let allAttendance = [];
        try {
            allAttendance = await Attendance.findAll({
                where: {
                    date: { [Op.between]: [startOfWeekStr, endOfWeekStr] },
                    [Op.or]: [{ forenoon: true }, { afternoon: true }]
                }
            });
        } catch (e) {
            console.warn("Could not fetch Attendance for weekly salary overview:", e.message);
            allAttendance = [];
        }

        // 3. Fetch Production Logs (as Operator)
        let productionLogs = [];
        try {
            productionLogs = await ProductionLog.findAll({
                where: {
                    is_deleted: false,
                    production_date: { [Op.between]: [startOfWeekStr, endOfWeekStr] }
                },
                include: [{
                    model: ProductionEmployee,
                    as: "employees",
                    required: false,
                    where: { is_deleted: false }
                }]
            });
        } catch (e) {
            console.warn("Could not fetch ProductionLog for weekly salary overview:", e.message);
            productionLogs = [];
        }

        const salaryData = (staff || []).map(member => {
            const memberRole = member.staffRole || "Driver";
            // Determine which earning categories are allowed based on staffRole
            const canEarnAsLoader = true; // Any employee assigned as loader on an order earns loader wages
            const canEarnAsDriver = true; // Drivers assigned to deliveries earn driver credits
            const canEarnAsOperator = ["Driver", "Operator", "Stocker"].includes(memberRole);

            // Loader Earnings (Amount Based - Shared among item loaders)
            let loaderTotal = 0;
            const loaderOrders = [];
            const drivenOrders = [];

            if (Array.isArray(allOrderStaff)) {
                allOrderStaff.forEach(a => {
                    if (a && a.employee_id === member.userid && a.orderItem && a.orderItem.order) {
                        if (a.role === "loader") {
                            const orderEmps = Array.isArray(a.orderItem.orderEmployees) ? a.orderItem.orderEmployees : [];
                            const numLoaders = orderEmps.filter(oe => oe && oe.role === "loader").length || 1;
                            const itemAmt = (parseFloat(a.orderItem.quantity) || 0) * (parseFloat(a.orderItem.loader_charge_per_unit) || 0);
                            const share = isNaN(itemAmt / numLoaders) ? 0 : (itemAmt / numLoaders);
                            loaderTotal += share;

                            loaderOrders.push({
                                date: a.orderItem.order.date || "",
                                product: a.orderItem.product || "Hollow Bricks",
                                qty: a.orderItem.quantity || 0,
                                rate: a.orderItem.loader_charge_per_unit || 0,
                                amount: share.toFixed(2)
                            });
                        } else if (a.role === "driver" && canEarnAsDriver) {
                            drivenOrders.push({
                                date: a.orderItem.order.date || "",
                                product: a.orderItem.product || "Delivery",
                                qty: a.orderItem.quantity || 0,
                                orderId: a.orderItem.order.order_id
                            });
                        }
                    }
                });
            }

            // Driver Earnings (Attendance & Delivery Duty based) - Only for Driver role
            let driverTotal = 0;
            const driverDays = [];

            if (canEarnAsDriver) {
                const driverDayMap = new Map(); // key: dateStr (YYYY-MM-DD)

                // 1. Process explicit attendance records
                if (Array.isArray(allAttendance)) {
                    allAttendance
                        .filter(a => a && a.userid === member.userid)
                        .forEach(a => {
                            const dateStr = typeof a.date === "string" ? a.date.slice(0, 10) : new Date(a.date).toISOString().slice(0, 10);
                            const isFullDay = a.forenoon && a.afternoon;
                            const isHalfDay = (a.forenoon && !a.afternoon) || (!a.forenoon && a.afternoon);
                            const multiplier = isFullDay ? 1.0 : (isHalfDay ? 0.5 : 0);

                            driverDayMap.set(dateStr, {
                                date: a.date,
                                type: "Attendance",
                                forenoon: Boolean(a.forenoon),
                                afternoon: Boolean(a.afternoon),
                                multiplier,
                                trips: []
                            });
                        });
                }

                // 2. Process driven orders (if on duty driving deliveries on that date)
                drivenOrders.forEach(order => {
                    const dateStr = typeof order.date === "string" ? order.date.slice(0, 10) : new Date(order.date).toISOString().slice(0, 10);
                    if (driverDayMap.has(dateStr)) {
                        const existing = driverDayMap.get(dateStr);
                        existing.trips.push(order);
                        // If marked half day but drove delivery trips, credit as full day duty
                        if (existing.multiplier < 1.0) {
                            existing.multiplier = 1.0;
                        }
                    } else {
                        // Driver drove delivery orders on this date, count as full day duty
                        driverDayMap.set(dateStr, {
                            date: order.date,
                            type: "Trip Duty",
                            forenoon: true,
                            afternoon: true,
                            multiplier: 1.0,
                            trips: [order]
                        });
                    }
                });

                // 3. Compute driver details and total
                driverDayMap.forEach(entry => {
                    const dayEarning = entry.multiplier * driverRate;
                    driverTotal += dayEarning;

                    let sessionText = "";
                    if (entry.type === "Attendance") {
                        sessionText = (entry.forenoon ? "FN" : "") + (entry.forenoon && entry.afternoon ? "+" : "") + (entry.afternoon ? "AN" : "");
                        if (entry.trips.length > 0) {
                            const tripNames = entry.trips.map(t => t.product).join(", ");
                            sessionText += ` • Drive (${tripNames})`;
                        }
                    } else {
                        const tripNames = entry.trips.map(t => t.product).join(", ");
                        sessionText = `Drive (${tripNames})`;
                    }

                    driverDays.push({
                        date: entry.date,
                        type: entry.type,
                        session: sessionText,
                        rate: driverRate,
                        amount: dayEarning.toFixed(2),
                        tripsCount: entry.trips.length
                    });
                });

                // Sort chronological
                driverDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            }

            // Operator Earnings (Amount Based - Shared among production staff)
            let operatorTotal = 0;
            const productionRecords = [];
            if (canEarnAsOperator && Array.isArray(productionLogs)) {
                productionLogs.forEach(log => {
                    const employees = Array.isArray(log.employees) ? log.employees : [];
                    if (employees.some(e => e && e.employee_id === member.userid)) {
                        const count = employees.length || 1;
                        const totalProdAmt = (parseFloat(log.number_of_stocks) || 0) * (parseFloat(log.price_per_stock) || 0);
                        const share = isNaN(totalProdAmt / count) ? 0 : (totalProdAmt / count);
                        operatorTotal += share;
                        productionRecords.push({
                            date: log.production_date || "",
                            product: "Production",
                            qty: log.number_of_stocks || 0,
                            amount: share.toFixed(2)
                        });
                    }
                });
            }

            const total = (parseFloat(loaderTotal) || 0) + (parseFloat(driverTotal) || 0) + (parseFloat(operatorTotal) || 0);

            return {
                id: member.userid,
                name: member.name || "Staff",
                phone: member.phoneNumber || "",
                staffRole: member.staffRole || "Driver",
                totalSalary: isNaN(total) ? "0.00" : total.toFixed(2),

                // Breakdowns for the modal and details
                loader: {
                    total: isNaN(loaderTotal) ? "0.00" : loaderTotal.toFixed(2),
                    count: loaderOrders.length,
                    details: loaderOrders
                },
                driver: {
                    total: isNaN(driverTotal) ? "0.00" : driverTotal.toFixed(2),
                    count: driverDays.length,
                    rate: driverRate,
                    details: driverDays,
                    trips: drivenOrders
                },
                operator: {
                    total: isNaN(operatorTotal) ? "0.00" : operatorTotal.toFixed(2),
                    count: productionRecords.length,
                    details: productionRecords
                }
            };
        });

        return res.status(200).json({
            success: true,
            weekRange: { start: startOfWeek, end: endOfWeek },
            globalDriverRate: driverRate,
            data: salaryData,
            salaryData: salaryData
        });
    } catch (error) {
        console.error("Flexible Salary Overview Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Update global driver daily rate
exports.updateGlobalDriverRate = async (req, res) => {
    try {
        const rate = req.body.rate !== undefined ? req.body.rate : req.body.value;
        if (rate === undefined || isNaN(parseFloat(rate))) {
            return res.status(400).json({ success: false, message: "Valid rate is required" });
        }
        let setting = await GlobalSetting.findOne({ where: { key: "driver_daily_rate" } });
        if (setting) {
            setting.value = String(rate);
            await setting.save();
        } else {
            setting = await GlobalSetting.create({ key: "driver_daily_rate", value: String(rate) });
        }
        return res.status(200).json({ success: true, message: "Global driver rate updated", rate: parseFloat(rate) });
    } catch (error) {
        console.error("Error updating global driver rate:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Kept for backward compatibility if needed, but the overview is preferred
exports.getLoaderSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.getDriverSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.getOperatorSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.updateDailySalary = async (req, res) => res.status(410).json({ message: "Use global-settings" });
