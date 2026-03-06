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
        const settingsMap = settings.reduce((acc, curr) => {
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
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);

        // Fetch Global Driver Rate
        const rateSetting = await GlobalSetting.findOne({ where: { key: "driver_daily_rate" } });
        const driverRate = parseFloat(rateSetting ? rateSetting.value : 750);

        // Fetch all Staff (userRole: 2) with staffRole
        const staff = await User.findAll({
            where: { userRole: 2, isDeleted: false },
            attributes: ["userid", "name", "phoneNumber", "staffRole"]
        });

        // 1. Fetch Orders (Loader & Driver info)
        const allOrderStaff = await OrderEmployee.findAll({
            include: [{
                model: OrderItem,
                as: "orderItem",
                include: [{
                    model: Order,
                    as: "order",
                    where: {
                        is_deleted: false,
                        date: { [Op.between]: [startOfWeek, endOfWeek] }
                    }
                }, {
                    model: OrderEmployee,
                    as: "orderEmployees"
                }]
            }]
        });

        // 2. Fetch Attendance (as Driver)
        const allAttendance = await Attendance.findAll({
            where: {
                date: { [Op.between]: [startOfWeek, endOfWeek] },
                [Op.or]: [{ forenoon: true }, { afternoon: true }]
            }
        });

        // 3. Fetch Production Logs (as Operator)
        const productionLogs = await ProductionLog.findAll({
            where: {
                is_deleted: false,
                production_date: { [Op.between]: [startOfWeek, endOfWeek] }
            },
            include: [{ model: ProductionEmployee, as: "employees" }]
        });

        const salaryData = staff.map(member => {
            // Determine which earning categories are allowed based on staffRole
            const canEarnAsLoader = ["Driver", "Loader"].includes(member.staffRole);
            const canEarnAsDriver = member.staffRole === "Driver";
            const canEarnAsOperator = ["Driver", "Operator", "Stocker"].includes(member.staffRole);

            // Loader Earnings (Amount Based - Shared among item loaders)
            let loaderTotal = 0;
            const loaderOrders = [];
            const drivenOrders = [];

            if (canEarnAsLoader) {
                allOrderStaff.forEach(a => {
                    if (a.employee_id === member.userid && a.orderItem && a.orderItem.order) {
                        if (a.role === "loader") {
                            const numLoaders = a.orderItem.orderEmployees.filter(oe => oe.role === "loader").length || 1;
                            const itemAmt = (parseFloat(a.orderItem.quantity) || 0) * (parseFloat(a.orderItem.loader_charge_per_unit) || 0);
                            const share = itemAmt / numLoaders;
                            loaderTotal += share;

                            loaderOrders.push({
                                date: a.orderItem.order.date,
                                product: a.orderItem.product,
                                qty: a.orderItem.quantity,
                                rate: a.orderItem.loader_charge_per_unit,
                                amount: share.toFixed(2)
                            });
                        } else if (a.role === "driver" && canEarnAsDriver) {
                            drivenOrders.push({
                                date: a.orderItem.order.date,
                                product: a.orderItem.product,
                                qty: a.orderItem.quantity,
                                amount: "0.00 (Attendance Based)"
                            });
                        }
                    }
                });
            }

            // Driver Earnings (Attendance Based ONLY) - Only for Driver role
            let attendanceRecords = [];
            let driverTotal = 0;
            if (canEarnAsDriver) {
                attendanceRecords = allAttendance.filter(a => a.userid === member.userid);
                driverTotal = attendanceRecords.length * driverRate;
            }

            // Operator Earnings (Amount Based - Shared among production staff)
            let operatorTotal = 0;
            const productionRecords = [];
            if (canEarnAsOperator) {
                productionLogs.forEach(log => {
                    if (log.employees.some(e => e.employee_id === member.userid)) {
                        const share = ((parseFloat(log.number_of_stocks) || 0) * (parseFloat(log.price_per_stock) || 0)) / (log.employees.length || 1);
                        operatorTotal += share;
                        productionRecords.push({
                            date: log.production_date,
                            product: "Production",
                            qty: log.number_of_stocks,
                            amount: share.toFixed(2)
                        });
                    }
                });
            }

            return {
                id: member.userid,
                name: member.name,
                phone: member.phoneNumber,
                staffRole: member.staffRole,
                totalSalary: (loaderTotal + driverTotal + operatorTotal).toFixed(2),

                // Breakdowns for the modal
                loader: {
                    total: loaderTotal.toFixed(2),
                    count: loaderOrders.length,
                    details: loaderOrders
                },
                driver: {
                    total: driverTotal.toFixed(2),
                    count: attendanceRecords.length,
                    rate: driverRate,
                    details: [
                        ...attendanceRecords.map(a => ({
                            date: a.date,
                            type: "Attendance",
                            amount: driverRate.toFixed(2),
                            session: (a.forenoon ? "FN" : "") + (a.forenoon && a.afternoon ? "+" : "") + (a.afternoon ? "AN" : "")
                        })),
                        ...drivenOrders.map(d => ({
                            date: d.date,
                            type: `Drive (${d.product})`,
                            amount: "0.00"
                        }))
                    ]
                },
                operator: {
                    total: operatorTotal.toFixed(2),
                    count: productionRecords.length,
                    details: productionRecords
                }
            };
        });

        return res.status(200).json({
            success: true,
            weekRange: { start: startOfWeek, end: endOfWeek },
            globalDriverRate: driverRate,
            data: salaryData
        });
    } catch (error) {
        console.error("Flexible Salary Overview Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Kept for backward compatibility if needed, but the overview is preferred
exports.getLoaderSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.getDriverSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.getOperatorSalaries = async (req, res) => res.status(410).json({ message: "Use weekly-overview" });
exports.updateDailySalary = async (req, res) => res.status(410).json({ message: "Use global-settings" });
