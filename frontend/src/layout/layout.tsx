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
    <div className="grid grid-cols-12 gap-20 h-screen bg-gray-100 p-3">
      {isOpen && <Sidebar className="col-span-2 h-full shadow-md" />}

      <div className={`${isOpen ? "col-span-10" : "col-span-12"} flex flex-col h-[calc(100vh-28px)] gap-4`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 py-0">
          <Outlet />

        </main>
      </div>
    </div>
  );
};

export default Layout;