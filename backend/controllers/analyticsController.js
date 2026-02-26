const { CustomerStatement, MaterialStatement, BunkStatement, ServiceStatement, Op } = require("../models");
const moment = require("moment");

exports.getTodaySummary = async (req, res) => {
    try {
        const todayDate = moment().format('YYYY-MM-DD');
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();

        // Income: Customer payments
        const incoming = await CustomerStatement.sum('amount', {
            where: {
                date: todayDate,
                is_deleted: false
            }
        }) || 0;

        // Expenses: Material Statements, Bunk Statements, Service Statements
        const materialExp = await MaterialStatement.sum('amount', {
            where: {
                createdAt: { [Op.between]: [startOfDay, endOfDay] }
            }
        }) || 0;

        const bunkExp = await BunkStatement.sum('amount', {
            where: {
                date: { [Op.between]: [startOfDay, endOfDay] }
            }
        }) || 0;

        const serviceExp = await ServiceStatement.sum('amount', {
            where: {
                createdAt: { [Op.between]: [startOfDay, endOfDay] }
            }
        }) || 0;

        const totalOutgoing = Number(materialExp) + Number(bunkExp) + Number(serviceExp);

        return res.status(200).json({
            success: true,
            todayIncome: Number(incoming),
            todayExpenses: totalOutgoing
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
