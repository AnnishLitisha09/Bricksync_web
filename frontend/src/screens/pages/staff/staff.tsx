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
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const itemsPerPage = 8;

  const drivers = useDriverStore((state) => state.drivers) as InternalDriver[];
  const setDrivers = useDriverStore((state) => state.setDrivers);

  const fetchDrivers = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers`, { headers: getAuthHeader() });
      const data = await res.json();
      setDrivers(data as DriverType[]);
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
    fetchDrivers();
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const query = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(query) ||
        (d.phoneNumber && d.phoneNumber.includes(query)) ||
        (d.email && d.email.toLowerCase().includes(query)) ||
        (d.staffRole && d.staffRole.toLowerCase().includes(query))
      );
    });
  }, [drivers, search]);

  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDrivers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDrivers, currentPage]);

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-6 md:space-y-10 font-sans max-w-[1600px] mx-auto">

      {/* --- Header Section --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 md:space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-100 mx-auto lg:mx-0">
            <ShieldCheck size={14} />
            Verified System Access
          </div>
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
              <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{drivers.length}</p>
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

      {/* --- Filters & View Toggle --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
      </div>

      {/* --- Main Content --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Database...</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW (Default Mobile/Tablet) */}
          {(viewMode === "grid" || window.innerWidth < 1024) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {paginatedDrivers.map((driver) => (
                <div key={driver._id} className="bg-white rounded-[2rem] border border-slate-200 flex flex-col hover:shadow-2xl transition-all group">
                  <div className="p-6 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-slate-50 bg-slate-100">
                        {driver.imageUrl ? (
                          <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={24} /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 truncate">{driver.name}</h3>
                        <span className="text-indigo-500 font-bold text-[10px] uppercase">{driver.staffRole || "Personnel"}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === driver._id ? null : driver._id); }} className="p-2 text-slate-400 hover:text-slate-900">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  <div className="px-6 space-y-2 pb-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <Mail size={14} /> {driver.email || "No Email"}
                    </div>
                    <button
                      onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)}
                      className="w-full mt-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE VIEW (Desktop Only) */}
          {viewMode === "table" && window.innerWidth >= 1024 && (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personnel</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedDrivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                            {driver.imageUrl ? <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" /> : <User className="m-auto text-slate-300 mt-2" size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{driver.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">ID: #{driver.userid?.toString().slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase">
                          {driver.staffRole || "Personnel"}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-600 flex items-center gap-2"><Mail size={12} /> {driver.email}</p>
                          <p className="text-sm text-slate-400 flex items-center gap-2"><Phone size={12} /> {driver.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${driver.status === 'Inactive' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-bold text-slate-600">{driver.status || "Active"}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink size={18} /></button>
                          <button onClick={(e) => handleDeleteUser(e, driver.userid)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDrivers.length)} of {filteredDrivers.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30"><ChevronLeft size={18} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-xl text-[11px] font-black ${currentPage === page ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border"}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDrivers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <Search size={48} className="text-slate-200 mb-4" />
          <h2 className="text-xl font-black text-slate-800">No Records Found</h2>
          <button onClick={() => setSearch("")} className="mt-4 text-indigo-600 font-bold underline">Clear Search</button>
        </div>
      )}
    </div>
  );
};

export default Staff;