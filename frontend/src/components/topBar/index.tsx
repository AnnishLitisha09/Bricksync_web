import { Search, Bell, Clock, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useCommonStore } from "../../store";
import { useUserStore } from "../../store/useUserStore";
import { FILE_BASE_URL } from "../../api/base";
import { fetchTodayCalls } from "../../api/callLog";

/* 🔹 Role config */
const roleConfig: Record<number, { label: string; className: string }> = {
  1: { label: "Admin", className: "bg-yellow-200 text-gray-800" },
  2: { label: "Driver1", className: "bg-blue-200 text-blue-800" },
  3: { label: "Customer", className: "bg-green-200 text-green-800" },
};

export default function Topbar() {
  const isOpen = useCommonStore((state) => state.isOpen);
  const toggle = useCommonStore((state) => state.toggle);
  const user = useUserStore((state) => state.user);
  const [dateTime, setDateTime] = useState("");
  const [callCount, setCallCount] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateTime(now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getCallReminders = async () => {
      try {
        const res = await fetchTodayCalls();
        if (res.data) {
          setCallCount(res.data.length);
        }
      } catch (error) {
        console.error("Error fetching call reminders in Topbar:", error);
      }
    };

    getCallReminders();
    // Refresh every 5 minutes to keep it updated
    const interval = setInterval(getCallReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.userRole ? roleConfig[user.userRole] : null;

  return (
    <header className="bg-white flex items-center justify-between px-3 md:px-6 py-2 rounded-2xl shadow-md mx-2 md:mx-4 mt-2">
      {/* --- Left Section --- */}
      <div className="flex items-center gap-2 md:gap-3">
        {!isOpen && (
          <button onClick={toggle} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Menu size={20} />
          </button>
        )}

        {/* Search: Hidden on very small screens, shown on md+ */}
        <div className="relative w-fit hidden lg:block z-0">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-0 " />
          <input
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* --- Right Section --- */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* Date & Time: Hidden on mobile (too long), shown on sm+ */}
        <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-gray-600">
          <Clock size={16} />
          <span className="whitespace-nowrap">{dateTime}</span>
        </div>

        {/* Notification */}
        <div
          className="relative p-1 text-gray-400"
        >
          <Bell size={20} />
          {callCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white px-1 shadow-sm">
              {callCount}
            </span>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 md:gap-3 border-l pl-3 border-gray-100">
          <div className="flex-col leading-tight text-rightn hidden sm:flex">
            <span className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-1 max-w-[80px] md:max-w-none">
              {user?.name || "Gustavo Xavier"}
            </span>
            {role && (
              <span className={`inline-flex w-fit ml-auto items-center rounded-full px-2 py-[1px] text-[10px] md:text-xs font-medium ${role.className}`}>
                {role.label}
              </span>
            )}
          </div>

          <img
            src={user?.imageUrl ? `${FILE_BASE_URL}${user.imageUrl}` : "https://i.pravatar.cc/40"}
            alt="profile"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-200 object-cover"
          />
        </div>
      </div>
    </header>
  );
}