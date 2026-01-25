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
  Landmark, // Added icon for Shop
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCommonStore } from "../../store";
import React from "react";

/* ✅ ADDED LOGO */
import Logo from "../../assets/logo.png";
import { useUserStore } from "../../store/useUserStore";

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
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    children: [],
  },
  {
    name: "Vehicles",
    icon: Truck,
    path: "/vehicles",
    children: [
      { name: "Fuel", path: "/vehicles/fuel" },
      { name: "Service", path: "/vehicles/service" },
    ],
  },
  {
    name: "Customers",
    icon: Users,
    path: "/customers",
    children: [
      { name: "View Customers", path: "/customers/view" },
      { name: "Add Customer", path: "/customers/add" },
      { name: "Edit Customer", path: "/customers/edit" },
    ],
  },
  {
    name: "Stock",
    icon: Boxes,
    path: "/stock",
    children: [
      { name: "View Stock", path: "/stock/view" },
      { name: "Add Stock", path: "/stock/add" },
      { name: "Edit Stock", path: "/stock/edit" },
    ],
  },
  {
    name: "Staff",
    icon: UserCheck,
    path: "/staff",
    // children: [
    //   { name: "View Staff", path: "/staff/view" },
    //   { name: "Add Staff", path: "/staff/add" },
    //   { name: "Edit Staff", path: "/staff/edit" },
    // ],
  },
  {
    name: "Shop",
    icon: ShoppingCart, 
    path: "/shop",
    children: [
      { name: "Bunks", path: "/shop/bunks" },
      { name: "Services", path: "/shop/services" },
    ],
  },
  {
    name: "Banks",
    icon: Landmark,
    path: "/banks",
    children: [],
  },
  {
    name: "Profile",
    icon: User,
    path: "/profile",
    children: [],
  },
];

export default function Sidebar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogout, setShowLogout] = React.useState(false);

  const isOpen = useCommonStore((state) => state.isOpen);
  const toggle = useCommonStore((state) => state.toggle);
  const logout = useUserStore((state) => state.logout);

  const handleLogout = async () => {
    logout(); // clears token + user safely
    navigate("/login");
  };

  return (
    <>
      <aside
        className={`relative z-10 w-64 bg-white flex flex-col gap-5 px-4 py-6 rounded-2xl ${className}`}
      >
        {isOpen && (
          <div
            className="absolute right-3 top-5 cursor-pointer p-1"
            onClick={toggle}
          >
            <X />
          </div>
        )}

        {/* BRAND */}
        <div className="flex items-center gap-3 px-2">
          <img
            src={Logo}
            alt="Aswath Hollow Bricks"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">ASWATH</p>
            <p className="text-xs font-medium text-orange-500">
              HOLLOW BRICKS
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* NAV */}
        <nav className="flex-1 space-y-1">
          <div className="text-xs uppercase text-slate-500 px-2">
            All pages
          </div>

          {menu.map((item) => {
            const isParentActive =
              item.path && location.pathname.includes(item.path);

            return (
              <div key={item.name}>
                <div
                  onClick={() => navigate(item.path)}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition relative
                  ${isParentActive
                      ? "text-orange-500 bg-orange-50"
                      : "hover:bg-orange-50"
                    }`}
                >
                  {isParentActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-orange-500 rounded-full" />
                  )}
                  <div className="flex gap-3 items-center">
                    <item.icon size={18} />
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                  {item.children && item.children.length > 0 && (
                    <ChevronDown size={14} />
                  )}
                </div>

                {item.children && isParentActive && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children.map((sub) => {
                      const isActive = location.pathname.includes(sub.path);

                      return (
                        <div
                          key={sub.name}
                          onClick={() => navigate(sub.path)}
                          className={`px-3 py-2 text-sm rounded-md cursor-pointer transition relative
                          ${isActive
                              ? "text-orange-500 bg-orange-50"
                              : "hover:bg-orange-50"
                            }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-orange-500 rounded-full" />
                          )}
                          <p>{sub.name}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* SETTINGS */}
        <div
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer"
        >
          <Settings size={18} />
          <p>Settings</p>
        </div>

        {/* LOGOUT */}
        <div
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
        >
          <LogOut size={18} />
          <p>Logout</p>
        </div>
      </aside>

      {/* LOGOUT MODAL */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Logout
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
