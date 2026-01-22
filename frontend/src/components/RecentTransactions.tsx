import React from "react";
import { useNavigate } from "react-router-dom";

export type Transaction = {
  id: number;
  name: string;
  category: string;
  date: string;
  amount: string; // still string, but will be shown in ₹
  isSent?: boolean;
};

interface RecentTransactionsProps {
  transactions: Transaction[];
  viewAllPath?: string; // path to navigate when "View All" is clicked
}

// Avatar from name
const getAvatarFromName = (name: string) => {
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Convert $ or plain number to ₹
const formatToRupees = (amount: string) => {
  const numericValue = amount.replace(/[$,₹]/g, "");
  const sign = numericValue.startsWith("-")
    ? "-"
    : numericValue.startsWith("+")
    ? "+"
    : "";
  const value = numericValue.replace(/[+-]/g, "");
  return `${sign}₹${Number(value).toLocaleString("en-IN")}`;
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  viewAllPath = "/transactions", // default path
}) => {
  const navigate = useNavigate();
  const showTransactions = transactions.slice(0, 5); // only first 5

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
      <h2 className="font-semibold mb-4">Recent Transactions</h2>

      <div className="flex flex-col divide-y">
        {showTransactions.map((t) => {
          const avatar = getAvatarFromName(t.name);
          const status: "completed" | "pending" =
            t.isSent === true || t.isSent === false ? "completed" : "pending";
          const amountColor =
            t.isSent === true
              ? "text-red-600"
              : t.isSent === false
              ? "text-green-600"
              : "text-gray-400";

          return (
            <div key={t.id} className="flex items-center justify-between py-4">
              {/* Left Side */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                  {avatar}
                </div>
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-gray-500">
                    {t.category} • {t.date}
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full border text-center w-24 ${
                    status === "completed"
                      ? "text-green-600 border-green-200 bg-green-50"
                      : "text-orange-600 border-orange-200 bg-orange-50"
                  }`}
                >
                  {status}
                </span>
                <span className={`font-medium text-right w-28 ${amountColor}`}>
                  {formatToRupees(t.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      {transactions.length > 5 && (
        <div className="mt-4 text-center">
          <button
            className="text-blue-600 font-medium hover:underline"
            onClick={() => navigate(viewAllPath)}
          >
            View All
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
