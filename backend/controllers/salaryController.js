const { OrderEmployee, OrderItem, Order, User, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getLoaderSalaries = async (req, res) => {
    try {
        const loaders = await User.findAll({
            where: {
                staffRole: "Loader",
                isDeleted: false
            },
            attributes: ["userid", "name", "phoneNumber"],
            include: [
                {
                    model: OrderEmployee,
                    as: "loaderAssignments",
                    attributes: ["id", "order_item_id"],
                    where: { role: "loader" },
                    required: false, // Include loaders even if they have no assignments
                    include: [
                        {
                            model: OrderItem,
                            as: "orderItem",
                            attributes: ["id", "quantity", "loader_charge_per_unit", "product"],
                            include: [
                                {
                                    model: Order,
                                    as: "order",
                                    attributes: ["order_id", "date"],
                                    where: { is_deleted: false }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        const salaryData = loaders.map(loader => {
            let totalSalary = 0;
            const assignments = (loader.loaderAssignments || []).filter(a => a.orderItem && a.orderItem.order);

            assignments.forEach(a => {
                const qty = parseFloat(a.orderItem.quantity) || 0;
                const rate = parseFloat(a.orderItem.loader_charge_per_unit) || 0;
                totalSalary += qty * rate;
            });

            return {
                id: loader.userid,
                name: loader.name,
                phone: loader.phoneNumber,
                totalSalary: totalSalary.toFixed(2),
                assignmentCount: assignments.length
            };
        });

        return res.status(200).json({ success: true, data: salaryData });
    } catch (error) {
        console.error("Error fetching loader salaries:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
