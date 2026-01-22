import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export type StatCardProps = {
  title: string;
  amount: string | number; // allow number also
  change: string | number;
  positive?: boolean;
};

// Format to Indian Rupees
const formatToRupees = (value: string | number) => {
  const numberValue =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

  if (isNaN(numberValue)) return value;

  return `₹${numberValue.toLocaleString("en-IN")}`;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  change,
  positive = true,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{title}</span>
        {positive ? (
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Amount in Rupees */}
      <div className="text-2xl font-semibold text-gray-900">
        {formatToRupees(amount)}
      </div>

      {/* Change in Rupees */}
      <div className={`text-sm ${positive ? "text-green-600" : "text-red-600"}`}>
        {formatToRupees(change)} from last month
      </div>
    </div>
  );
};

export default StatCard;
