import { useNavigate } from "react-router-dom";
import { Boxes, Truck } from "lucide-react";

const shopItems = [
  {
    name: "Bunks",
    icon: Truck,
    path: "/shop/bunks",
    bgColor: "bg-orange-50",
    textColor: "text-orange-500",
  },
  {
    name: "Services",
    icon: Boxes,
    path: "/shop/services",
    bgColor: "bg-green-50",
    textColor: "text-green-500",
  },
];

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shop Dashboard</h1>
        <p className="text-sm text-gray-500">Select an option to manage</p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {shopItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`cursor-pointer ${item.bgColor} rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:shadow-lg transition`}
            >
              <Icon size={36} className={item.textColor} />
              <p className={`text-lg font-semibold ${item.textColor}`}>
                {item.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
