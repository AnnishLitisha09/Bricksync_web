import { Search, Bell, Clock, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useCommonStore } from "../../store";
import { useUserStore } from "../../store/useUserStore";
import { FILE_BASE_URL } from "../../api/base";

/* 🔹 Role config */
const roleConfig: Record<
  number,
  { label: string; className: string }
> = {
  1: {
    label: "Admin",
    className: "bg-yellow-200 text-gray-800",
  },
  2: {
    label: "Driver",
    className: "bg-blue-200 text-blue-800",
  },
  3: {
    label: "Customer",
    className: "bg-green-200 text-green-800",
  },
};

export default function Topbar() {
  const isOpen = useCommonStore((state) => state.isOpen);
  const toggle = useCommonStore((state) => state.toggle);

  const user = useUserStore((state) => state.user);

  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setDateTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.userRole
    ? roleConfig[user.userRole]
    : null;

  return (
    <header className="bg-white flex items-center justify-between px-6 py-2 rounded-2xl shadow-md ml-4">
      {/* Left */}
      <div className="flex items-center gap-3">
        {!isOpen && (
          <div onClick={toggle} className="cursor-pointer p-2">
            <Menu />
          </div>
        )}

        <div className="relative w-[420px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{dateTime}</span>
        </div>

        {/* Notification */}
        <Bell className="text-gray-500 cursor-pointer" />

        {/* Profile */}
        <div className="flex items-center gap-3">
          <img
            src={
              user?.imageUrl
                ? `${FILE_BASE_URL}${user.imageUrl}`
                : "https://i.pravatar.cc/40"
            }
            alt="profile"
            className="w-9 h-9 rounded-full object-cover"
          />

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-800">
              {user?.name || "Gustavo Xavier"}
            </span>

            {/* 🔹 Role Chip */}
            {role && (
              <span
                className={`mt-1 inline-flex w-fit items-center rounded-full px-3 py-[2px] text-xs font-medium ${role.className}`}
              >
                {role.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
