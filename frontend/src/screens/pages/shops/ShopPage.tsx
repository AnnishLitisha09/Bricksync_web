import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Boxes,
  Fuel,
  ArrowRight,
  Package,
  ShoppingCart,
  ShieldCheck,
  Building2
} from "lucide-react";

const shopItems = [
  {
    name: "Fuel Bunks",
    description: "Manage petrol & diesel stations, owners, statements, and credit limits.",
    icon: Fuel,
    path: "/shop/bunks",
    color: "indigo",
    stats: "Fuel Stations & Tankers",
  },
  {
    name: "Service Shops",
    description: "Manage repair workshops, vehicle mechanics, and scheduled maintenance partners.",
    icon: Boxes,
    path: "/shop/services",
    color: "emerald",
    stats: "Partner Workshops",
  },
  {
    name: "Material Suppliers",
    description: "Hardware, raw aggregates, spare parts, and construction material vendors.",
    icon: Package,
    path: "/shop/materials",
    color: "blue",
    stats: "Verified Material Vendors",
  },
  {
    name: "Other Buying",
    description: "Miscellaneous procurement, site consumables, office supplies, and tools.",
    icon: ShoppingCart,
    path: "/shop/procurement",
    color: "purple",
    stats: "Procurement Points",
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "indigo": return { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", hoverBorder: "hover:border-indigo-300", accent: "bg-indigo-600" };
    case "emerald": return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", hoverBorder: "hover:border-emerald-300", accent: "bg-emerald-600" };
    case "blue": return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", hoverBorder: "hover:border-blue-300", accent: "bg-blue-600" };
    case "purple": return { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", hoverBorder: "hover:border-purple-300", accent: "bg-purple-600" };
    default: return { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-100", hoverBorder: "hover:border-slate-300", accent: "bg-slate-600" };
  }
};

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in font-sans">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <ShieldCheck size={11} /> Merchant Ecosystem
            </span>
            <span className="text-xs font-bold text-slate-400">• 4 Specialized Portals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Partner <span className="text-indigo-600">Network</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage vendors, suppliers, and service providers with statement reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 h-10 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs font-bold text-slate-700">
            <Building2 size={15} className="text-indigo-600" />
            <span>Active Merchants</span>
          </div>
        </div>
      </div>

      {/* ─── CARDS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {shopItems.map((item, idx) => {
          const Icon = item.icon;
          const theme = getColorClasses(item.color);

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(item.path)}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md ${theme.hoverBorder} transition-all cursor-pointer group flex flex-col justify-between`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`size-12 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text} border ${theme.border} group-hover:scale-105 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <div className={`size-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${theme.bg} ${theme.text}`}>
                    <ArrowRight size={15} />
                  </div>
                </div>

                <div>
                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${theme.text}`}>
                    {item.stats}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-800 transition-colors">
                  Open Hub
                </span>
                <span className="text-xs font-black text-indigo-600 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
