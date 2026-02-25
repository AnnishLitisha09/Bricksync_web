import { Outlet } from "react-router-dom";
import Sidebar from "../components/sideBar";
import Topbar from "../components/topBar";
import { useCommonStore } from "../store";
import React from "react";

const Layout = () => {

  const isOpen = useCommonStore((state) => state.isOpen);
  const setIsOpen = useCommonStore((state) => state.setIsOpen);

  React.useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setIsOpen]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {isOpen && (
        <div
          className={`
            /* Mobile: Fixed overlay */
            fixed inset-y-0 left-0 z-10 w-64 bg-white
            /* Desktop: Relative (pushes content) */
            lg:relative lg:z-0 lg:block
          `}
        >
          <Sidebar className="h-full shadow-md" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>

    </div>


  );
};

export default Layout;