const {
    CustomerStatement,
    MaterialStatement,
    BunkStatement,
    ServiceStatement,
    WalletTransaction,
    FuelStatement,
    sequelize,
    Op
} = require("../models");
const moment = require("moment");

exports.getTodaySummary = async (req, res) => {
    try {
        const todayStr = moment().format('YYYY-MM-DD');
        const startOfTodayUTC = moment().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss');
        const endOfTodayUTC = moment().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss');

        // Income 1: Customer payments
        const incoming = await CustomerStatement.sum('amount', {
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { date: todayStr },
                            { [Op.and]: [{ date: null }, { created_at: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }] }
                        ]
                    },
                    { is_deleted: false }
                ]
            }
        }) || 0;

        // Income 2: Wallet Transactions (received)
        const walletIncoming = await WalletTransaction.sum('amount', {
            where: {
                type: 'received',
                [Op.or]: [
                    { date: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }, // Wallet date is inclusive of time
                    { [Op.and]: [{ date: null }, { createdAt: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }] }
                ]
            }
        }) || 0;

        // Expenses 1: Material Statements (Paid to Suppliers)
        const materialExp = await MaterialStatement.sum('amount', {
            where: { createdAt: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }
        }) || 0;

        // Expenses 2: Service Statements (Paid to Service Shops)
        const serviceExp = await ServiceStatement.sum('amount', {
            where: { createdAt: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }
        }) || 0;

        // Expenses 3: Fuel Statements (Paid to Bunks)
        const fuelExp = await FuelStatement.sum('amount', {
            where: { createdAt: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }
        }) || 0;

        // Expenses 4: Wallet Outgoing (Sent)
        const walletOutgoing = await WalletTransaction.sum('amount', {
            where: {
                type: 'sent',
                [Op.or]: [
                    { date: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } },
                    { [Op.and]: [{ date: null }, { createdAt: { [Op.between]: [startOfTodayUTC, endOfTodayUTC] } }] }
                ]
            }
        }) || 0;

        const totalIncome = Number(incoming) + Number(walletIncoming);
        const totalOutgoing = Number(materialExp) + Number(serviceExp) + Number(fuelExp) + Number(walletOutgoing);

        return res.status(200).json({
            success: true,
            todayIncome: totalIncome,
            todayExpenses: totalOutgoing
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
