import React, { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import type { Transaction } from "../../../components/RecentTransactions";

const getAvatarFromName = (name: string) => {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

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

interface TransactionsPageProps {
  transactions: Transaction[];
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions }) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "received" | "pending">("all");

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      const matchesSearch =
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.category.toLowerCase().includes(searchText.toLowerCase()) ||
        t.date.includes(searchText);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "sent") matchesStatus = t.isSent === true;
      if (statusFilter === "received") matchesStatus = t.isSent === false;
      if (statusFilter === "pending") matchesStatus = t.isSent === undefined;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchText, statusFilter]);

  return (
    <div className="p-5 lg:p-10 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">Transactions</h1>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Search Bar */}
        <div className="flex items-center bg-white border rounded-lg shadow-sm px-3 py-2 w-full md:w-1/2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, category, or date"
            className="ml-2 w-full outline-none text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <X
              className="w-4 h-4 text-gray-400 cursor-pointer"
              onClick={() => setSearchText("")}
            />
          )}
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          {["all", "sent", "received", "pending"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                statusFilter === status
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {filteredTransactions.length === 0 && (
          <div className="p-6 text-center text-gray-400">No transactions found.</div>
        )}

        {filteredTransactions.map((t) => {
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
            <div key={t.id} className="flex items-center justify-between p-4">
              {/* Left */}
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

              {/* Right */}
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
    </div>
  );
};

export default TransactionsPage;
