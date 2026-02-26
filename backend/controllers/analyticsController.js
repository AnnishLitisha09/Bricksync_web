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
        const todayDate = moment().format('YYYY-MM-DD');

        // Income 1: Customer payments
        const incoming = await CustomerStatement.sum('amount', {
            where: {
                [Op.and]: [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('date')), todayDate),
                    { is_deleted: false }
                ]
            }
        }) || 0;

        // Income 2: Wallet Transactions (received)
        const walletIncoming = await WalletTransaction.sum('amount', {
            where: {
                type: 'received',
                [Op.and]: [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('date')), todayDate)
                ]
            }
        }) || 0;

        // Expenses: Material Statements, Bunk Statements, Service Statements, Fuel Statements, Wallet Sent
        const materialExp = await MaterialStatement.sum('amount', {
            where: sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), todayDate)
        }) || 0;

        const bunkExp = await BunkStatement.sum('amount', {
            where: sequelize.where(sequelize.fn('DATE', sequelize.col('date')), todayDate)
        }) || 0;

        const serviceExp = await ServiceStatement.sum('amount', {
            where: sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), todayDate)
        }) || 0;

        const fuelExp = await FuelStatement.sum('amount', {
            where: sequelize.where(sequelize.fn('DATE', sequelize.col('createdAt')), todayDate)
        }) || 0;

        const walletOutgoing = await WalletTransaction.sum('amount', {
            where: {
                type: 'sent',
                [Op.and]: [
                    sequelize.where(sequelize.fn('DATE', sequelize.col('date')), todayDate)
                ]
            }
        }) || 0;

        const totalIncome = Number(incoming) + Number(walletIncoming);
        const totalOutgoing = Number(materialExp) + Number(bunkExp) + Number(serviceExp) + Number(fuelExp) + Number(walletOutgoing);

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
