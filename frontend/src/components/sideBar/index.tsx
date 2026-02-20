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
  StickyNote, // Added for Notepad
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
      { name: "Transactions", path: "/banks/transactions" },
    ],
  },
  { name: "Notepad", icon: StickyNote, path: "/notepad" }, // ✅ Added Notepad below Banks
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        {/* BRAND SECTION */}
        <div className="p-6 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <div className="bg-orange-100 p-2 rounded-xl shadow-inner">
              <img src={Logo} alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-slate-900 uppercase">Aswath</span>
              <span className="text-[10px] font-bold text-orange-600 tracking-widest uppercase leading-none">Hollow Bricks</span>
            </div>
          </motion.div>
          <button onClick={toggle} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="px-6 mb-4">
          <div className="relative group">
            <Search 
               size={18} 
               className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                 searchQuery ? 'text-orange-500' : 'text-slate-400 group-focus-within:text-orange-400'
               }`} 
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pages..."
              className="w-full bg-slate-50 pl-10 pr-10 py-2.5 text-sm border border-transparent rounded-2xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-orange-50 focus:border-orange-200 transition-all"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* NAVIGATION AREA */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar pb-4">
          <motion.p 
            layout
            className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-2"
          >
            {searchQuery ? "Search Results" : "Main Menu"}
          </motion.p>

          <div className="space-y-1">
            {filteredMenu.length > 0 ? (
              filteredMenu.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                // Match exact path for profile/notepad or startsWith for items with children
                const isActive = hasChildren 
                  ? location.pathname.startsWith(item.path) 
                  : location.pathname === item.path;
                  
                const isExpanded = searchQuery ? true : (expandedItems.includes(item.name) || (isActive && hasChildren));

                return (
                  <motion.div layout key={item.name} className="overflow-hidden">
                    <button
                      onClick={() => hasChildren ? toggleSubmenu(item.name) : navigate(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
                        ${isActive && !hasChildren 
                          ? "bg-orange-50 text-orange-600" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={`${isActive ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600"}`} />
                        <span className="text-sm font-semibold">{item.name}</span>
                      </div>
                      {hasChildren && (
                        <ChevronDown 
                          size={16} 
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
                          className="ml-6 pl-4 border-l-2 border-slate-100 space-y-1 mt-1 mb-2"
                        >
                          {item.children?.map((sub) => {
                            const isSubActive = location.pathname === sub.path;
                            return (
                              <button
                                key={sub.name}
                                onClick={() => navigate(sub.path)}
                                className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors font-medium
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
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-10"
              >
                 <p className="text-sm text-slate-400 italic">No pages found matching "{searchQuery}"</p>
              </motion.div>
            )}
          </div>

          {!searchQuery && (
            <motion.div layout className="pt-4 mt-6 border-t border-slate-50">
              <button
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Settings size={20} className="text-slate-400" />
                <span className="text-sm font-semibold">Settings</span>
              </button>

              <button
                onClick={() => setShowLogout(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
              >
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
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
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8"
            >
              <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <LogOut className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign Out</h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Are you sure you want to exit the application? You will need to login again to access your data.</p>
              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={handleLogout} 
                  className="w-full py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-[0.98]"
                >
                  Logout
                </button>
                <button 
                  onClick={() => setShowLogout(false)} 
                  className="w-full py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
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