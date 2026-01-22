// src/components/QuickActions.tsx
import React, { useState } from "react";
import { Send, CreditCard, Plus, Download, X } from "lucide-react";

const QuickActions: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const actions = [
    {
      label: "Transfer Money",
      icon: <Send className="w-6 h-6 text-white" />,
      bgColor: "bg-blue-500",
      onClick: () => {},
    },
    {
      label: "Download Report",
      icon: <Download className="w-6 h-6 text-white" />,
      bgColor: "bg-green-500",
      onClick: () => setIsModalOpen(true),
    },
    {
      label: "View Cards",
      icon: <CreditCard className="w-6 h-6 text-white" />,
      bgColor: "bg-purple-500",
      onClick: () => {},
    },
    {
      label: "Add Account",
      icon: <Plus className="w-6 h-6 text-white" />,
      bgColor: "bg-orange-500",
      onClick: () => {},
    },
  ];

  const handleDownload = () => {
    const today = new Date().toISOString().split("T")[0]; // current date YYYY-MM-DD

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (endDate > today) {
      setError("End date cannot be in the future.");
      return;
    }

    setError("");
    console.log("Download report from", startDate, "to", endDate);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h2 className="font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:shadow-md transition-all duration-150"
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-lg ${action.bgColor}`}
            >
              {action.icon}
            </div>
            <span className="text-sm font-medium text-center">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-white/20 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-xl w-96 p-6 z-10">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-800">Download Report</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} // max today
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} // max today
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleDownload}
                className="mt-4 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
