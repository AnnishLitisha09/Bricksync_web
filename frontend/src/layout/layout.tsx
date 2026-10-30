import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/sideBar";
import Topbar from "../components/topBar";
import { useCommonStore } from "../store";
import { useEffect } from "react";

const Layout = () => {
  const setIsOpen = useCommonStore((state) => state.setIsOpen);
  const location = useLocation();

  // Auto-close mobile drawer upon route change
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [location.pathname, setIsOpen]);

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. Fixed Top Software Command Bar */}
      <Topbar />

      {/* 2. Software Desktop Environment Canvas */}
      <div className="flex flex-1 overflow-hidden p-2 sm:p-2.5 pt-1.5 gap-2 sm:gap-2.5 h-[calc(100vh-56px)]">
        {/* Left Software Dock Rail / Drawer */}
        <Sidebar />

        {/* Right Framed Internal Software Window */}
        <div className="flex flex-col flex-1 overflow-hidden h-full min-w-0 transition-all duration-300">
          <main className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden h-full">
            <div className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar animate-in select-text p-4 sm:p-6 lg:p-7 pb-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
