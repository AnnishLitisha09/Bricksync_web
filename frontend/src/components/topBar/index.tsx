import {
  Search,
  Bell,
  Clock,
  Menu,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommonStore } from "../../store";
import { useUserStore } from "../../store/useUserStore";
import { FILE_BASE_URL } from "../../api/base";
import { fetchUnreadCount } from "../../api/notification";
import Logo from "../../assets/logo.png";
import GlobalSearchModal from "./GlobalSearchModal";

const roleConfig: Record<number, { label: string; className: string }> = {
  1: { label: "Admin", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  2: { label: "Driver", className: "bg-blue-50 text-blue-700 border-blue-200" },
  3: { label: "Customer", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function Topbar() {
  const navigate = useNavigate();
  const toggle = useCommonStore((state) => state.toggle);
  const isDockMode = useCommonStore((state) => state.isDockMode);
  const toggleDockMode = useCommonStore((state) => state.toggleDockMode);
  const user = useUserStore((state) => state.user);
  const [dateTime, setDateTime] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateTime(
        now.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getNotificationCount = async () => {
      try {
        const res = await fetchUnreadCount();
        if (res.success) {
          setNotifCount(res.count);
        }
      } catch (error) {
        console.error("Error fetching notification count in Topbar:", error);
      }
    };

    getNotificationCount();
    const interval = setInterval(getNotificationCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.userRole ? roleConfig[user.userRole] : null;

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3 sm:px-4 flex items-center justify-between shadow-2xs z-30 shrink-0 select-none">
      {/* --- Left: Brand Logo & Title & Dock Toggle --- */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          onClick={toggle}
          aria-label="Toggle mobile menu"
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-indigo-100 lg:hidden"
        >
          <Menu size={18} strokeWidth={2.5} />
        </button>

        {/* Brand Icon & Name */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-indigo-600 size-9 rounded-xl p-1.5 shadow-md shadow-indigo-600/20 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all shrink-0">
            <img
              src={Logo}
              alt="BrickSync"
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight italic select-none">
              Brick<span className="text-indigo-600">Sync</span>
            </h1>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider border border-indigo-100">
              CRM v2.4
            </span>
          </div>
        </div>

        {/* Desktop Expand / Collapse Dock Rail Button */}
        <button
          onClick={toggleDockMode}
          aria-label="Toggle sidebar width"
          className="hidden lg:flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100 ml-1"
          title={isDockMode ? "Expand to Full Sidebar" : "Collapse to Software Dock Rail"}
        >
          {isDockMode ? (
            <PanelLeftOpen size={17} strokeWidth={2.2} />
          ) : (
            <PanelLeftClose size={17} strokeWidth={2.2} />
          )}
        </button>
      </div>

      {/* --- Center: Global CRM Search Launcher --- */}
      <div 
        onClick={() => setIsSearchOpen(true)}
        className="relative w-48 sm:w-64 md:w-80 hidden md:block cursor-pointer group"
      >
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-600 transition-colors pointer-events-none"
        />
        <div className="w-full bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-xl pl-9 pr-11 py-1.5 text-xs font-semibold text-slate-400 flex items-center justify-between transition-all shadow-2xs group-hover:border-indigo-300">
          <span>Quick search clients, fleet...</span>
          <kbd className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* --- Right: Security, Live Clock, Notifications, Profile --- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Encrypted Backend Security Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px] font-black uppercase tracking-wider text-indigo-700">
          <ShieldCheck size={12} className="text-indigo-600" />
          <span>AES-256 SECURED</span>
        </div>

        {/* Live Date & Time with Seconds */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-bold text-slate-600">
          <Clock size={13} className="text-indigo-600" />
          <span className="whitespace-nowrap tracking-tight font-mono text-[11px]">
            {dateTime}
          </span>
        </div>

        {/* System Online Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[10px] font-black uppercase tracking-wider text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>

        {/* Unread Notifications Button */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-red-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white px-0.5 shadow-sm">
              {notifCount > 99 ? "99+" : notifCount}
            </span>
          )}
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 cursor-pointer group"
        >
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[110px]">
              {user?.name || "Administrator"}
            </span>
            {role ? (
              <span
                className={`inline-flex w-fit ml-auto items-center rounded-md px-1.5 py-0.2 text-[8px] font-extrabold uppercase tracking-wider border ${role.className}`}
              >
                {role.label}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">
                Admin
              </span>
            )}
          </div>

          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-xs shadow-sm ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all">
              {user?.imageUrl ? (
                <img
                  src={`${FILE_BASE_URL}${user.imageUrl}`}
                  alt="Profile"
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                "A"
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
        </div>
      </div>

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
