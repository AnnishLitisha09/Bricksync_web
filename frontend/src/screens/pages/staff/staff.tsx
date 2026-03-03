import {
  ExternalLink,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  List
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { useDriverStore, type DriverType } from "../../../store/driverStore";
import { obfuscate } from "../../../utils/encryption";

interface InternalDriver extends Omit<DriverType, 'status'> {
  _id: string;
  staffRole?: string;
  status?: "Active" | "Inactive" | "On Leave" | "Away";
}

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const itemsPerPage = 8;

  const drivers = useDriverStore((state) => state.drivers) as InternalDriver[];
  const setDrivers = useDriverStore((state) => state.setDrivers);

  const fetchDrivers = async (page: number, searchQuery: string = ""): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers?page=${page}&limit=${itemsPerPage}&search=${searchQuery}`, { headers: getAuthHeader() });
      const data = await res.json();
      setDrivers(data.drivers as DriverType[]);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalCount);
    } catch (error) {
      console.error("Error fetching drivers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (e: React.MouseEvent, driverId: string | number) => {
    e.stopPropagation();
    if (!window.confirm("Permanent Action: Delete this personnel record?")) return;
    try {
      const res = await fetch(`${BASE_URL}/user/${driverId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const updatedDrivers = drivers.filter(d => d.userid !== driverId);
        setDrivers(updatedDrivers as DriverType[]);
        setActiveMenu(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  useEffect(() => {
    fetchDrivers(currentPage, search);
  }, [currentPage, search]);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);



  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-6 md:space-y-10 font-sans max-w-[1600px] mx-auto">

      {/* --- Header Section --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 md:space-y-4 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-100 mx-auto lg:mx-0"
          >
            <ShieldCheck size={14} />
            Verified System Access
          </motion.div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight md:leading-none">
              Personnel <span className="text-indigo-600">Hub</span>
            </h1>
            <p className="mt-2 md:mt-3 text-slate-500 font-medium text-base md:text-lg max-w-xl mx-auto lg:mx-0">
              Centralized management for institutional staff and fleet security profiles.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
          <div className="bg-white p-2 rounded-2xl md:rounded-3xl border border-slate-200 flex items-center gap-4 pr-6 shadow-sm w-full sm:w-auto">
            <div className="bg-slate-900 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-slate-200">
              <Users size={20} className="text-white md:size-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Workforce</p>
              <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{totalItems}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/driver/add")}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 md:px-8 py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl md:rounded-[2rem] shadow-xl shadow-indigo-100 transition-all active:scale-95 font-bold"
          >
            <Plus size={20} />
            Add New Member
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="relative group w-full max-w-2xl">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-12 py-4 md:py-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-semibold text-slate-700 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-indigo-600">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="hidden lg:flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <List size={20} />
          </button>
        </div>
      </motion.div>

      {/* --- Main Content --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Database...</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {(viewMode === "grid" || window.innerWidth < 1024) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {drivers.map((driver) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    key={driver._id}
                    className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group overflow-hidden"
                  >
                    <div className="p-8 pb-4 flex items-start justify-between">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-slate-50 bg-slate-100 group-hover:ring-indigo-100 transition-all shadow-inner">
                          {driver.imageUrl ? (
                            <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={28} /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors text-lg">{driver.name}</h3>
                          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-500 font-bold text-[10px] uppercase rounded-full mt-1 border border-indigo-100">{driver.staffRole || "Personnel"}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === driver._id ? null : driver._id);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-xl transition-colors"
                        >
                          <MoreVertical size={20} />
                        </button>
                        <AnimatePresence>
                          {activeMenu === driver._id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 py-3"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/driver/view/${obfuscate(driver.userid)}`);
                                }}
                                className="w-full text-left px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                              >
                                <ExternalLink size={16} className="text-indigo-500" /> View Details
                              </button>
                              <button
                                onClick={(e) => handleDeleteUser(e, driver.userid)}
                                className="w-full text-left px-5 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 size={16} className="text-red-400" /> Delete Staff
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="px-8 space-y-3 pb-8">
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 bg-slate-50/80 p-3 rounded-2xl group-hover:bg-indigo-50 transition-colors overflow-hidden">
                        <Mail size={16} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{driver.email || "No Email Address"}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)}
                        className="w-full mt-2 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 group/btn"
                      >
                        View Profile
                        <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && window.innerWidth >= 1024 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-10">Personnel Detail</th>
                    <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Designation</th>
                    <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                    <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Work Status</th>
                    <th className="p-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right pr-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {drivers.map((driver) => (
                      <motion.tr
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={driver._id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-8 pl-10">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all shadow-inner flex-shrink-0">
                              {driver.imageUrl ? <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" /> : <User className="m-auto text-slate-300 mt-2.5" size={22} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{driver.name}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Personnel ID: #{driver.userid?.toString().slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-8">
                          <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-tight border border-indigo-100">
                            {driver.staffRole || "Personnel"}
                          </span>
                        </td>
                        <td className="p-8">
                          <div className="space-y-1.5">
                            <p className="text-sm font-bold text-slate-600 flex items-center gap-3"><Mail size={16} className="text-slate-300" /> {driver.email}</p>
                            <p className="text-sm text-slate-400 font-semibold flex items-center gap-3"><Phone size={16} className="text-slate-300" /> {driver.phoneNumber}</p>
                          </div>
                        </td>
                        <td className="p-8">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ring-4 ${driver.status === 'Inactive' ? 'bg-amber-400 ring-amber-100' : 'bg-emerald-500 ring-emerald-100'}`} />
                            <span className="text-xs font-black text-slate-700">{driver.status || "Active"}</span>
                          </div>
                        </td>
                        <td className="p-8 text-right pr-10">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ExternalLink size={18} /></button>
                            <button onClick={(e) => handleDeleteUser(e, driver.userid)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col md:flex-row items-center justify-between gap-6 py-10 border-t border-slate-100"
            >
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Personnel Roster: <span className="text-slate-900 ml-2">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} — {Math.min(currentPage * itemsPerPage, totalItems)}</span> of {totalItems} members
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-2xl text-xs font-black transition-all active:scale-95 ${currentPage === page ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 translate-y-[-2px]" : "bg-white text-slate-400 border border-slate-200 hover:border-indigo-400"}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {drivers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search size={40} className="text-slate-200" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">No Records Found</h2>
              <p className="text-slate-400 mt-2 font-medium">Try adjusting your search or filters.</p>
              <button
                onClick={() => setSearch("")}
                className="mt-8 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Clear Search
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Staff;