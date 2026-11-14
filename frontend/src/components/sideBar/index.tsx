import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Bell,
  Truck,
  Fuel,
  Wrench,
  Settings,
  Navigation,
  Users,
  Calendar,
  PhoneCall,
  LifeBuoy,
  Boxes,
  History,
  UserCheck,
  Clock,
  Coins,
  ShoppingBag,
  Store,
  Landmark,
  ArrowLeftRight,
  StickyNote,
  FileText,
  FilePlus,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  TrendingUp,
  Layers,
  Tv,
  FlaskConical,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCommonStore } from "../../store";
import { useUserStore } from "../../store/useUserStore";
import { BASE_URL, getAuthHeader } from "../../api/base";
import { fetchCustomers } from "../../api/customer";
import Logo from "../../assets/logo.png";

interface SubMenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  children?: SubMenuItem[];
  badge?: boolean;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    id: "operations",
    title: "Core Operations",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      {
        name: "Stock & Production",
        icon: Boxes,
        path: "/stock",
        children: [
          { name: "Stock Inventory", icon: Boxes, path: "/stock" },
          { name: "Production History", icon: History, path: "/inventory/history" },
          { name: "Plant Mix Ratios (BOM)", icon: FlaskConical, path: "/production/mix-ratio" },
          { name: "BOM & Stock Depletion", icon: Layers, path: "/inventory/bom" },
        ],
      },
      { name: "Factory TV Kiosk", icon: Tv, path: "/kiosk" },
    ],
  },
  {
    id: "sales_customers",
    title: "Sales & Dispatch",
    items: [
      {
        name: "Customers & CRM",
        icon: Users,
        path: "/customers",
        children: [
          { name: "Customer Directory", icon: Users, path: "/customers" },
          { name: "Cursors (Quarry Loads)", icon: Layers, path: "/cursors" },
          { name: "Today's Delivery Entry", icon: Calendar, path: "/todays-entry" },
          { name: "New Dispatch Entry", icon: FilePlus, path: "/customer/add-material/new" },
          { name: "Call Logs", icon: PhoneCall, path: "/call-logs" },
          { name: "Support & Contact", icon: LifeBuoy, path: "/contact" },
        ],
      },
      {
        name: "Invoicing & Bills",
        icon: FileText,
        path: "/invoices",
        children: [
          { name: "Generate Invoice", icon: FilePlus, path: "/invoices/add" },
          { name: "Invoice History", icon: FileText, path: "/invoices/history" },
          { name: "Quick Bill (Notepad)", icon: StickyNote, path: "/notepad" },
          { name: "Bill History", icon: History, path: "/view-notepad" },
        ],
      },
    ],
  },
  {
    id: "logistics_fleet",
    title: "Fleet & Logistics",
    items: [
      {
        name: "Vehicles & Fleet",
        icon: Truck,
        path: "/vehicles",
        children: [
          { name: "Fleet List", icon: Truck, path: "/vehicles" },
          { name: "GPS Live Tracking", icon: Navigation, path: "/vehicles/gprs" },
          { name: "Fuel Records", icon: Fuel, path: "/vehicles/fuel" },
          { name: "Service & Repairs", icon: Wrench, path: "/vehicles/services" },
          { name: "Spares Management", icon: Settings, path: "/vehicle/spares" },
        ],
      },
      {
        name: "Vendor Commercial Shops",
        icon: ShoppingBag,
        path: "/shop",
        children: [
          { name: "Commercial Overview", icon: ShoppingBag, path: "/shop" },
          { name: "Raw Material Vendors", icon: Store, path: "/shop/materials" },
          { name: "Fuel Bunks", icon: Fuel, path: "/shop/bunks" },
          { name: "Service Garages", icon: Wrench, path: "/shop/services" },
        ],
      },
    ],
  },
  {
    id: "finance_intelligence",
    title: "Finance & Intelligence",
    items: [
      {
        name: "Executive BI & P&L",
        icon: TrendingUp,
        path: "/bi-analytics",
        children: [
          { name: "Unit Economics & P&L", icon: TrendingUp, path: "/bi-analytics" },
          { name: "BOM & Depletion", icon: Layers, path: "/inventory/bom" },
          { name: "Factory TV Kiosk", icon: Tv, path: "/kiosk" },
        ],
      },
      {
        name: "Banking & Ledger",
        icon: Landmark,
        path: "/banks",
        children: [
          { name: "Bank Accounts", icon: Landmark, path: "/banks" },
          { name: "Ledger Transactions", icon: ArrowLeftRight, path: "/transactions" },
        ],
      },
      {
        name: "Staff & Payroll",
        icon: UserCheck,
        path: "/staff",
        children: [
          { name: "Employee Directory", icon: UserCheck, path: "/staff" },
          { name: "Daily Attendance", icon: Clock, path: "/staff/attendance" },
          { name: "Weekly Wages / Salary", icon: Coins, path: "/salary" },
        ],
      },
    ],
  },
  {
    id: "system",
    title: "System & Account",
    items: [
      { name: "Notifications", icon: Bell, path: "/notifications", badge: true },
      { name: "My Profile", icon: User, path: "/profile" },
      { name: "System Settings", icon: Settings, path: "/settings" },
    ],
  },
];

const fullMenu: MenuItem[] = menuGroups.flatMap((group) => group.items);

const EXPANDED_SECTIONS_STORAGE_KEY = "bricksync_sidebar_expanded_sections";

const getInitialExpandedItems = (): string[] => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const stored = window.localStorage.getItem(EXPANDED_SECTIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading expanded sidebar items from localStorage:", e);
  }
  return [];
};

export default function Sidebar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isOpen = useCommonStore((state) => state.isOpen);
  const setIsOpen = useCommonStore((state) => state.setIsOpen);
  const isDockMode = useCommonStore((state) => state.isDockMode);
  const toggleDockMode = useCommonStore((state) => state.toggleDockMode);

  const logout = useUserStore((state) => state.logout);
  const user = useUserStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>(getInitialExpandedItems);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [cachedCustomers, setCachedCustomers] = useState<any[]>([]);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Automatically keep parent category expanded if current route matches a child item
  useEffect(() => {
    const activeParent = fullMenu.find((item) =>
      item.children?.some(
        (sub) =>
          location.pathname === sub.path ||
          location.pathname.startsWith(sub.path + "/")
      )
    );
    if (activeParent) {
      setExpandedItems((prev) => {
        if (prev.includes(activeParent.name)) return prev;
        const next = [...prev, activeParent.name];
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(
              EXPANDED_SECTIONS_STORAGE_KEY,
              JSON.stringify(next)
            );
          }
        } catch {}
        return next;
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    // Load customer names for fast 1-click sidebar search
    fetchCustomers("", 1, 1000)
      .then((res) => setCachedCustomers(res.data || []))
      .catch(() => {});

    const fetchUnread = async () => {
      try {
        const response = await fetch(`${BASE_URL}/notifications/unread-count`, {
          headers: getAuthHeader(),
        });
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (path: string) => {
    setActivePopover(null);
    setHoveredItem(null);
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    navigate("/login");
  };

  const handleMouseEnter = (itemName: string, hasChildren: boolean) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredItem(itemName);
    if (hasChildren) {
      setActivePopover(itemName);
    }
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActivePopover(null);
      setHoveredItem(null);
    }, 180);
  };

  // Grouped search filter
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return menuGroups;
    const query = searchQuery.toLowerCase().trim();
    return menuGroups
      .map((group) => {
        const isGroupTitleMatch = group.title.toLowerCase().includes(query);
        const matchingItems = group.items
          .map((item) => {
            const isItemMatch = item.name.toLowerCase().includes(query);
            const matchingChildren = item.children?.filter((sub) =>
              sub.name.toLowerCase().includes(query)
            );
            if (isGroupTitleMatch || isItemMatch) return item;
            if (matchingChildren && matchingChildren.length > 0) {
              return { ...item, children: matchingChildren };
            }
            return null;
          })
          .filter(Boolean) as MenuItem[];

        if (matchingItems.length > 0) {
          return { ...group, items: matchingItems };
        }
        return null;
      })
      .filter(Boolean) as MenuGroup[];
  }, [searchQuery]);

  const matchingCustomers = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return cachedCustomers
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          (c.phone_no && c.phone_no.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [cachedCustomers, searchQuery]);

  const toggleSubmenu = (name: string) => {
    setExpandedItems((prev) => {
      const next = prev.includes(name)
        ? prev.filter((i) => i !== name)
        : [...prev, name];
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(
            EXPANDED_SECTIONS_STORAGE_KEY,
            JSON.stringify(next)
          );
        }
      } catch (e) {
        console.error("Error saving expanded sidebar items to localStorage:", e);
      }
      return next;
    });
  };

  return (
    <>
      {/* --- Mobile Backdrop Blur Overlay --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 1. DESKTOP SOFTWARE DOCK RAIL (Collapsed Icon Mode)       */}
      {/* ========================================================= */}
      {isDockMode && (
        <aside
          className={`hidden lg:flex flex-col items-center justify-between w-[70px] bg-white rounded-2xl shadow-xs border border-slate-200/80 py-3 px-2 shrink-0 z-30 select-none h-full transition-all duration-200 relative ${
            className || ""
          }`}
        >
          {/* Top Stack of Icon Buttons Grouped with Mini Dividers */}
          <nav className="flex flex-col items-center w-full overflow-y-auto no-scrollbar space-y-1">
            {menuGroups.map((group, groupIdx) => (
              <div key={group.id} className="w-full flex flex-col items-center">
                {groupIdx > 0 && (
                  <div className="w-7 h-[1px] bg-slate-200/80 my-1.5 shrink-0" />
                )}
                {group.items.map((item) => {
                  const hasChildren = !!(item.children && item.children.length > 0);
                  const isChildActive = hasChildren
                    ? item.children!.some(
                        (sub) =>
                          location.pathname === sub.path ||
                          location.pathname.startsWith(sub.path + "/")
                      )
                    : false;
                  const isActive =
                    location.pathname === item.path ||
                    (!hasChildren &&
                      item.path !== "/" &&
                      location.pathname.startsWith(item.path)) ||
                    isChildActive;

                  const isPopoverOpen = activePopover === item.name;
                  const isTooltipVisible = hoveredItem === item.name && !hasChildren;
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.name}
                      className="relative group w-full flex justify-center py-0.5"
                      onMouseEnter={() => handleMouseEnter(item.name, hasChildren)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            setActivePopover(isPopoverOpen ? null : item.name);
                          } else {
                            handleNavigate(item.path);
                          }
                        }}
                        className={`relative size-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 shadow-2xs font-bold"
                            : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80"
                        }`}
                      >
                        <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />

                        {/* Notification Counter Badge */}
                        {item.badge && unreadCount > 0 && (
                          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}

                        {/* Micro Child Indicator Chevron */}
                        {hasChildren && (
                          <ChevronRight
                            size={10}
                            strokeWidth={3}
                            className={`absolute right-1 bottom-1 transition-colors ${
                              isActive
                                ? "text-indigo-600"
                                : "text-slate-300 group-hover:text-indigo-500"
                            }`}
                          />
                        )}
                      </button>

                      {/* Tooltip for Non-Child Items */}
                      {isTooltipVisible && (
                        <div className="absolute left-[60px] top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95">
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block">
                            {group.title}
                          </span>
                          <span>{item.name}</span>
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                        </div>
                      )}

                      {/* Flyout Submenu Popover for Items with Children */}
                      {hasChildren && isPopoverOpen && (
                        <div
                          className="absolute left-[60px] top-0 bg-white border border-slate-200/90 shadow-2xl rounded-2xl p-2 min-w-[220px] z-50 animate-in fade-in zoom-in-95 backdrop-blur-md"
                          onMouseEnter={() => {
                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                          }}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="px-3 py-1.5 border-b border-slate-100 mb-1.5 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block">
                                {group.title}
                              </span>
                              <span className="text-xs font-black text-slate-800">
                                {item.name}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {item.children!.length}
                            </span>
                          </div>

                          <div className="space-y-0.5">
                            {item.children!.map((sub) => {
                              const isSubActive =
                                location.pathname === sub.path ||
                                location.pathname.startsWith(sub.path + "/");
                              const SubIcon = sub.icon;
                              return (
                                <button
                                  key={sub.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigate(sub.path);
                                  }}
                                  className={`flex items-center gap-2.5 px-3 py-2 w-full rounded-xl cursor-pointer text-xs font-bold transition-all text-left ${
                                    isSubActive
                                      ? "bg-indigo-100 text-indigo-700 shadow-2xs font-extrabold"
                                      : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                  }`}
                                >
                                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                    <SubIcon
                                      size={15}
                                      className={
                                        isSubActive ? "text-indigo-600" : "text-slate-400"
                                      }
                                    />
                                  </div>
                                  <span className="truncate flex-1">{sub.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Rail Controls: Expand Sidebar, Settings & Logout */}
          <div className="w-full pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5 shrink-0">
            {/* Expand Dock Button */}
            <button
              onClick={toggleDockMode}
              title="Expand to Full Sidebar"
              className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={17} />
            </button>

            {/* Quick Settings Icon in Dock */}
            <button
              onClick={() => handleNavigate("/settings")}
              title="System Settings"
              className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <Settings size={17} />
            </button>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogout(true)}
              title="Logout Session"
              className="size-10 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut size={17} />
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 2. EXPANDED DESKTOP SIDEBAR (Categorized & Realigned)     */}
      {/* ========================================================= */}
      {!isDockMode && (
        <aside
          className={`hidden lg:flex flex-col justify-between w-64 bg-white rounded-2xl shadow-xs border border-slate-200/80 p-3 shrink-0 z-30 select-none h-full transition-all duration-200 ${
            className || ""
          }`}
        >
          {/* Header & Search */}
          <div className="space-y-2.5 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Navigation Matrix
                </span>
              </div>
              <button
                onClick={toggleDockMode}
                title="Collapse to Dock Rail"
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full bg-slate-50 border border-slate-200/80 pl-8 pr-7 py-1.5 text-xs font-semibold rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-3 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* 1-Click Client Search Results in Sidebar */}
            {matchingCustomers.length > 0 && (
              <div className="p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/70 space-y-1">
                <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> Clients Found
                  </span>
                  <span className="text-[9px] font-bold text-indigo-500">{matchingCustomers.length}</span>
                </div>
                {matchingCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      handleNavigate(`/customer/details/${c.id}`);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white transition-all text-left group cursor-pointer shadow-2xs border border-indigo-100/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-indigo-100 group-hover:bg-white text-indigo-700 group-hover:text-indigo-600 font-bold text-[9px] flex items-center justify-center shrink-0">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 group-hover:text-white truncate leading-tight">
                          {c.name}
                        </p>
                        <p className="text-[9px] text-slate-400 group-hover:text-indigo-200 font-mono truncate">
                          {c.phone_no || `#${c.id}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-slate-400 group-hover:text-white shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Categorized Module Nav Links */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar my-2 pr-1 space-y-3">
            {filteredGroups.map((group, groupIdx) => (
              <div
                key={group.id}
                className={groupIdx > 0 ? "pt-2 border-t border-slate-100/90" : ""}
              >
                {/* Group Section Header */}
                <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                  <span>{group.title}</span>
                  <span className="text-[9px] font-bold text-slate-300">
                    {group.items.length}
                  </span>
                </div>

                {/* Group Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const hasChildren = !!(item.children && item.children.length > 0);
                    const isChildActive = hasChildren
                      ? item.children!.some(
                          (sub) =>
                            location.pathname === sub.path ||
                            location.pathname.startsWith(sub.path + "/")
                        )
                      : false;
                    const isActive =
                      location.pathname === item.path ||
                      (!hasChildren &&
                        item.path !== "/" &&
                        location.pathname.startsWith(item.path)) ||
                      isChildActive;

                    const isExpanded =
                      searchQuery.length > 0 ||
                      expandedItems.includes(item.name) ||
                      (isActive && hasChildren);
                    const Icon = item.icon;

                    return (
                      <div key={item.name} className="overflow-hidden">
                        <button
                          onClick={() => {
                            if (hasChildren) {
                              toggleSubmenu(item.name);
                            } else {
                              handleNavigate(item.path);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                            isActive && !hasChildren
                              ? "bg-indigo-100 text-indigo-700 shadow-2xs font-extrabold"
                              : isActive && hasChildren
                              ? "text-indigo-900 bg-indigo-50/70"
                              : "text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-600"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Fixed Icon Column for Precision Horizontal Alignment */}
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <Icon
                                size={16}
                                className={
                                  isActive
                                    ? "text-indigo-600"
                                    : "text-slate-400 group-hover:text-indigo-600 transition-colors"
                                }
                              />
                            </div>
                            <span className="truncate text-left flex-1">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                            {item.badge && unreadCount > 0 && (
                              <span className="min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full px-1">
                                {unreadCount}
                              </span>
                            )}
                            {hasChildren && (
                              <ChevronDown
                                size={13}
                                className={`transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-indigo-600"
                                    : "text-slate-300 group-hover:text-slate-500"
                                }`}
                              />
                            )}
                          </div>
                        </button>

                        {/* Expandable Accordion Submenu */}
                        <AnimatePresence initial={false}>
                          {hasChildren && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.16 }}
                              className="ml-3 pl-3 border-l-2 border-indigo-100 space-y-0.5 mt-1 mb-1.5"
                            >
                              {item.children!.map((sub) => {
                                const isSubActive =
                                  location.pathname === sub.path ||
                                  location.pathname.startsWith(sub.path + "/");
                                const SubIcon = sub.icon;
                                return (
                                  <button
                                    key={sub.name}
                                    onClick={() => handleNavigate(sub.path)}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                      isSubActive
                                        ? "bg-indigo-100 text-indigo-700 font-extrabold shadow-2xs"
                                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40"
                                    }`}
                                  >
                                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                      <SubIcon
                                        size={13}
                                        className={
                                          isSubActive
                                            ? "text-indigo-600"
                                            : "text-slate-400"
                                        }
                                      />
                                    </div>
                                    <span className="truncate flex-1 text-left">
                                      {sub.name}
                                    </span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile & Actions Footer */}
          <div className="pt-2 border-t border-slate-100 space-y-2 shrink-0">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {user?.name || "Admin"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.email || "admin@bricksync.com"}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => handleNavigate("/settings")}
                className="flex-1 py-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/60"
              >
                <Settings size={13} />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setShowLogout(true)}
                className="flex-1 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-rose-200/60"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================= */}
      {/* 3. MOBILE RESPONSIVE DRAWER OVERLAY                       */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 shadow-2xl lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
          >
            <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-600/20">
              <img
                src={Logo}
                alt="Logo"
                className="h-5 w-5 object-contain brightness-0 invert"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900">
                Brick<span className="text-indigo-600">Sync</span>
              </span>
              <span className="ml-1 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase tracking-wider border border-indigo-100">
                CRM
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Nav Items Grouped */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {menuGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              className={groupIdx > 0 ? "pt-2 border-t border-slate-100" : ""}
            >
              <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const hasChildren = !!(item.children && item.children.length > 0);
                  const isChildActive = hasChildren
                    ? item.children!.some((sub) => location.pathname === sub.path)
                    : false;
                  const isActive =
                    location.pathname === item.path ||
                    (!hasChildren &&
                      item.path !== "/" &&
                      location.pathname.startsWith(item.path)) ||
                    isChildActive;

                  const isExpanded =
                    expandedItems.includes(item.name) || (isActive && hasChildren);
                  const Icon = item.icon;

                  return (
                    <div key={item.name} className="overflow-hidden">
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubmenu(item.name);
                          } else {
                            handleNavigate(item.path);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isActive && !hasChildren
                            ? "bg-indigo-100 text-indigo-700 font-black shadow-2xs"
                            : isActive && hasChildren
                            ? "text-indigo-900 bg-indigo-50/70"
                            : "text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            <Icon
                              size={17}
                              className={isActive ? "text-indigo-600" : "text-slate-400"}
                            />
                          </div>
                          <span className="truncate flex-1 text-left">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                          {item.badge && unreadCount > 0 && (
                            <span className="min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full px-1">
                              {unreadCount}
                            </span>
                          )}
                          {hasChildren && (
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-indigo-600" : "text-slate-300"
                              }`}
                            />
                          )}
                        </div>
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="ml-4 pl-3 border-l-2 border-indigo-100 space-y-0.5 mt-1 mb-1">
                          {item.children!.map((sub) => {
                            const isSubActive = location.pathname === sub.path;
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.name}
                                onClick={() => handleNavigate(sub.path)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-semibold transition-all text-left ${
                                  isSubActive
                                    ? "text-indigo-700 bg-indigo-50 font-bold"
                                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40"
                                }`}
                              >
                                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                  <SubIcon
                                    size={14}
                                    className={
                                      isSubActive ? "text-indigo-600" : "text-slate-400"
                                    }
                                  />
                                </div>
                                <span className="truncate flex-1">{sub.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Mobile Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/60">
          <button
            onClick={() => handleNavigate("/settings")}
            className="w-full py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setShowLogout(true)}
            className="w-full py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. CONFIRM LOGOUT MODAL (Tripzo Software Style)            */}
      {/* ========================================================= */}
      {showLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowLogout(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
              <LogOut size={26} />
            </div>
            <h2 className="text-slate-900 text-lg font-black tracking-tight">
              Confirm Logout
            </h2>
            <p className="text-slate-500 mt-1.5 text-xs font-medium">
              Are you sure you want to end your active BrickSync software session?
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
