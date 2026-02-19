import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Boxes, 
  Fuel, 
  ArrowRight, 
  Package, 
  ShoppingCart,
  ShieldCheck,
  LayoutGrid
} from "lucide-react";

const shopItems = [
  {
    name: "Fuel Bunks",
    description: "Manage petrol & diesel stations, owners, and credit limits.",
    icon: Fuel,
    path: "/shop/bunks",
    color: "orange",
    stats: "Active Stations",
  },
  {
    name: "Service Shops",
    description: "Manage workshops, mechanics, and maintenance partners.",
    icon: Boxes,
    path: "/shop/services",
    color: "emerald",
    stats: "Partner Workshops",
  },
  {
    name: "Material Suppliers",
    description: "Hardware, spare parts, and construction material vendors.",
    icon: Package,
    path: "/shop/materials",
    color: "violet",
    stats: "Verified Vendors",
  },
  {
    name: "Other Buying",
    description: "Miscellaneous procurement, office supplies, and tools.",
    icon: ShoppingCart,
    path: "/shop/procurement",
    color: "blue",
    stats: "Procurement Points",
  },
];

const getColorClasses = (color: string) => {
  switch (color) {
    case "orange": return { bg: "bg-orange-50", text: "text-orange-600", glow: "bg-orange-400", accent: "bg-orange-500" };
    case "emerald": return { bg: "bg-emerald-50", text: "text-emerald-600", glow: "bg-emerald-400", accent: "bg-emerald-500" };
    case "violet": return { bg: "bg-violet-50", text: "text-violet-600", glow: "bg-violet-400", accent: "bg-violet-500" };
    case "blue": return { bg: "bg-blue-50", text: "text-blue-600", glow: "bg-blue-400", accent: "bg-blue-500" };
    default: return { bg: "bg-gray-50", text: "text-gray-600", glow: "bg-gray-400", accent: "bg-gray-500" };
  }
};

export default function ShopPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8"
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            PARTNER <span className="text-orange-600 italic">NETWORK</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage vendors, suppliers, and service providers</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                <LayoutGrid size={16} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3-Col View</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    Verified
                </span>
            </div>
        </div>
      </div>

      {/* CARDS GRID - Set to 3 Columns on LG screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shopItems.map((item, idx) => {
          const Icon = item.icon;
          const theme = getColorClasses(item.color);

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(item.path)}
              className="group relative cursor-pointer"
            >
              <div className={`absolute inset-0 rounded-[2.5rem] transition-all duration-300 group-hover:scale-[1.05] blur-2xl opacity-10 ${theme.glow}`} />
              
              <div className="relative h-full bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-slate-200/50">
                
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-[2] ${theme.accent}`} />

                <div className="flex flex-col h-full space-y-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${theme.bg} ${theme.text}`}>
                      <Icon size={30} strokeWidth={2.5} />
                    </div>
                    <div className={`p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 ${theme.bg} ${theme.text}`}>
                      <ArrowRight size={18} />
                    </div>
                  </div>

                  <div className="grow">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${theme.text}`}>
                      {item.stats}
                    </p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                      {item.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-semibold opacity-80">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-dashed border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                      Enter Module
                    </span>
                    <div className={`w-2 h-2 rounded-full ${theme.glow}`} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Dynamic "Add New" placeholder to keep grid balanced if needed */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 0.5 }}
          className="hidden lg:flex border-4 border-dashed border-gray-100 rounded-[2.5rem] items-center justify-center p-8 hover:border-orange-100 hover:bg-orange-50/30 transition-all cursor-not-allowed"
        >
           <div className="text-center">
             <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <LayoutGrid className="text-gray-400" size={24} />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Modules<br/>Coming Soon</p>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}