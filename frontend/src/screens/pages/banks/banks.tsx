import React, { useState } from "react";
import QuickActions from "../../../components/QuickActions";
import RecentTransactions, { type Transaction } from "../../../components/RecentTransactions";
import StatCard, { type StatCardProps } from "../../../components/StatCard";
const transactions: Transaction[] = [
    {
        id: 1,
        name: "Amazon",
        category: "Shopping",
        date: "Oct 12, 2025",
        amount: "127.50",
        isSent: true,
    },
    {
        id: 2,
        name: "Salary Deposit",
        category: "Income",
        date: "Oct 10, 2025",
        amount: "5,420.00",
        isSent: false,
    },
    {
        id: 3,
        name: "Netflix",
        category: "Entertainment",
        date: "Oct 9, 2025",
        amount: "15.99",
        isSent: true,
    },
    {
        id: 4,
        name: "Whole Foods",
        category: "Groceries",
        date: "Oct 8, 2025",
        amount: "84.32",
        isSent: true,
    },
    {
        id: 5,
        name: "Shell Gas Station",
        category: "Transportation",
        date: "Oct 7, 2025",
        amount: "45.60",
        // Pending
    },
        {
        id: 5,
        name: "Shell Gas Station",
        category: "Transportation",
        date: "Oct 7, 2025",
        amount: "45.60",
        // Pending
    },
        {
        id: 5,
        name: "Shell Gas Station",
        category: "Transportation",
        date: "Oct 7, 2025",
        amount: "45.60",
        // Pending
    },
        {
        id: 5,
        name: "Shell Gas Station",
        category: "Transportation",
        date: "Oct 7, 2025",
        amount: "45.60",
        // Pending
    },
        {
        id: 5,
        name: "Shell Gas Station",
        category: "Transportation",
        date: "Oct 7, 2025",
        amount: "45.60",
        // Pending
    },
];
const statCardsData: StatCardProps[] = [
    { title: "Total Balance", amount: "48,574.32", change: "+12.5%" },
    { title: "Income", amount: "12,340.00", change: "+8.2%" },
    {
        title: "Expenses",
        amount: "8,254.18",
        change: "-3.1%",
        positive: false,
    },
    { title: "ICICI Bank", amount: "24,680.50", change: "+15.3%" },
    { title: "HDFC Bank", amount: "12,100.00", change: "+6.4%" },
    { title: "SBI Bank", amount: "8,750.00", change: "+2.1%" },
    { title: "Axis Bank", amount: "5,400.00", change: "-1.2%", positive: false },
    { title: "Canara Bank", amount: "3,200.00", change: "+0.9%" },
    { title: "Kotak Bank", amount: "4,100.00", change: "+4.5%" },
];
const Banks: React.FC = () => {
    const [showAll, setShowAll] = useState(false);

    const shouldShowViewAll = statCardsData.length > 8;
    const visibleCards = showAll ? statCardsData : statCardsData.slice(0, 8);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Banks</h1>
                    <p className="text-sm text-gray-500">
                        Welcome back, Admin! Here's your financial overview.
                    </p>
                </div>

                {shouldShowViewAll && (
                    <button
                        onClick={() => setShowAll((prev) => !prev)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                    >
                        {showAll ? "Show Less" : "View All"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {visibleCards.map((card, index) => (
                    <StatCard key={index} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentTransactions transactions={transactions} />
                <QuickActions />
            </div>
        </div>
    );
};

export default Banks;
