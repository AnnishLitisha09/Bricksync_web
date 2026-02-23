import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Search,
  Truck,
  UserCheck,
  Users,
  X,
  User,
  Settings,
  ShoppingCart,
  Landmark,
  StickyNote,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCommonStore } from "../../store";
import { useUserStore } from "../../store/useUserStore";

/* ✅ ASSETS */
import Logo from "../../assets/logo.png";

interface SubMenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  children?: SubMenuItem[];
}

const menu: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  {
    name: "Vehicles",
    icon: Truck,
    path: "/vehicles",
    children: [
      { name: "View Vehicles", path: "/vehicles" },
      { name: "Fuel Records", path: "/vehicles/fuel" },
      { name: "Service Logs", path: "/vehicles/services" },
    ],
  },
  {
    name: "Customers",
    icon: Users,
    path: "/customers",
    children: [
      { name: "Customer List", path: "/customers" },
      { name: "Contact Support", path: "/contact" },
    ],
  },
  {
    name: "Stock",
    icon: Boxes,
    path: "/stock",
    children: [
      { name: "Stock Inventory", path: "/stock" },
      { name: "Production History", path: "/inventory/history" },
    ],
  },
  {
    name: "Staff",
    icon: UserCheck,
    path: "/staff",
    children: [
      { name: "All Staff", path: "/staff" },
      { name: "Attendance", path: "/staff/attendance" },
    ],
  },
  {
    name: "Shop",
    icon: ShoppingCart,
    path: "/shop",
    children: [
      { name: "Shop Overview", path: "/shop" },
      { name: "Bunks", path: "/shop/bunks" },
      { name: "Services", path: "/shop/services" },
      { name: "Material", path: "/shop/materials" },
    ],
  },
  {
    name: "Banks",
    icon: Landmark,
    path: "/banks",
    children: [
      { name: "Bank Accounts", path: "/banks" },
      { name: "Transactions", path: "/transactions" },
    ],
  },
  { name: "Notepad", icon: StickyNote, path: "/notepad" },
  { name: "Profile", icon: User, path: "/profile" },
];

export default function Sidebar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isOpen = useCommonStore((state) => state.isOpen);
  const toggle = useCommonStore((state) => state.toggle);
  const logout = useUserStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return menu;
    const query = searchQuery.toLowerCase();
    return menu
      .map((item) => {
        const isParentMatch = item.name.toLowerCase().includes(query);
        const matchingChildren = item.children?.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        );
        if (isParentMatch) return item;
        if (matchingChildren && matchingChildren.length > 0) {
          return { ...item, children: matchingChildren };
        }
        return null;
      })
      .filter((item) => item !== null) as MenuItem[];
  }, [searchQuery]);

  const toggleSubmenu = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          } ${className}`}
      >
        {/* BRAND SECTION - Reduced padding from p-6 to p-5 */}
        <div className="p-5 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
            onClick={() => navigate("/dashboard")}
          >
            <div className="bg-orange-100 p-2 rounded-xl shadow-inner shrink-0">
              <img src={Logo} alt="Logo" className="h-7 w-7 object-contain" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight text-slate-900 uppercase truncate">Aswath</span>
              <span className="text-[9px] font-bold text-orange-600 tracking-widest uppercase leading-none truncate">Hollow Bricks</span>
            </div>
          </motion.div>
          <button onClick={toggle} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* SEARCH BAR - Adjusted padding */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <Search
              size={16}
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchQuery ? 'text-orange-500' : 'text-slate-400 group-focus-within:text-orange-400'
                }`}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-50 pl-9 pr-8 py-2 text-sm border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-200 transition-all"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* NAVIGATION AREA - Adjusted px-3 for tighter fit */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pb-4">
          <motion.p
            layout
            className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-2"
          >
            {searchQuery ? "Results" : "Menu"}
          </motion.p>

          <div className="space-y-0.5">
            {filteredMenu.length > 0 ? (
              filteredMenu.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isActive = hasChildren
                  ? location.pathname.startsWith(item.path)
                  : location.pathname === item.path;

                const isExpanded = searchQuery ? true : (expandedItems.includes(item.name) || (isActive && hasChildren));

                return (
                  <motion.div layout key={item.name} className="overflow-hidden">
                    <button
                      onClick={() => hasChildren ? toggleSubmenu(item.name) : navigate(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group
                        ${isActive && !hasChildren
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={`${isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600"}`} />
                        <span className="text-sm font-semibold whitespace-nowrap">{item.name}</span>
                      </div>
                      {hasChildren && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${isExpanded ? "rotate-180 text-orange-500" : "text-slate-300"}`}
                        />
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {hasChildren && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="ml-5 pl-3 border-l border-slate-100 space-y-0.5 mt-1 mb-2"
                        >
                          {item.children?.map((sub) => {
                            const isSubActive = location.pathname === sub.path;
                            return (
                              <button
                                key={sub.name}
                                onClick={() => navigate(sub.path)}
                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors font-medium
                                  ${isSubActive
                                    ? "text-orange-600 bg-orange-50/50"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}
                                `}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
                <p className="text-xs text-slate-400 italic">No matches found</p>
              </motion.div>
            )}
          </div>

          {!searchQuery && (
            <motion.div layout className="pt-4 mt-6 border-t border-slate-50">
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Settings size={18} className="text-slate-400" />
                <span className="text-sm font-semibold">Settings</span>
              </button>

              <button
                onClick={() => setShowLogout(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </motion.div>
          )}
        </nav>
      </aside>

      {/* LOGOUT MODAL */}
      <AnimatePresence>
        {showLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowLogout(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-6"
            >
              <div className="bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
                <LogOut className="text-red-500" size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Sign Out</h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Are you sure you want to exit? You will need to login again to access your data.</p>
              <div className="flex flex-col gap-2 mt-6">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowLogout(false)}
                  className="w-full py-2.5 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Stay Logged In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}