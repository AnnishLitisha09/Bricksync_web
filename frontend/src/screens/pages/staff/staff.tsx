import {
  ExternalLink, Mail, MoreVertical, Phone, Plus, Search, ShieldCheck,
  Trash2, Users, X, LayoutGrid, List, Loader2, ChevronRight, Pencil
} from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
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

const avatarColors = [
  "from-violet-500 to-purple-600", "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600", "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600", "from-cyan-500 to-sky-600",
];
const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const LIMIT = 8;

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const drivers = useDriverStore(s => s.drivers) as InternalDriver[];
  const setDrivers = useDriverStore(s => s.setDrivers);

  const fetchDrivers = async (page: number, q: string, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers?page=${page}&limit=${LIMIT}&search=${q}`, { headers: getAuthHeader() });
      const data = await res.json();
      setDrivers((append ? [...drivers, ...(data.drivers || [])] : (data.drivers || [])) as DriverType[]);
      setTotalItems(data.totalCount || 0);
      setHasMore(page < data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); setHasMore(true); fetchDrivers(1, search, false); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    await fetchDrivers(next, search, true);
  }, [loading, hasMore, currentPage, search]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  useEffect(() => {
    window.addEventListener("click", () => setActiveMenu(null));
    return () => window.removeEventListener("click", () => setActiveMenu(null));
  }, []);

  const handleDeleteUser = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!window.confirm("Delete this personnel record?")) return;
    const res = await fetch(`${BASE_URL}/user/${id}`, { method: 'DELETE', headers: getAuthHeader() });
    if (res.ok) { setDrivers(drivers.filter(d => d.userid !== id) as DriverType[]); setActiveMenu(null); }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-[#F8F9FC] space-y-6 md:space-y-8 font-sans max-w-[1600px] mx-auto">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-100">
            <ShieldCheck size={13} /> Verified System Access
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Personnel <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Centralized management for staff and fleet security profiles</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
              <Users size={16} className="text-white sm:size-5" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase leading-tight">Workforce</p>
              <p className="text-lg sm:text-2xl font-black text-slate-900 leading-none">{totalItems}</p>
            </div>
          </div>
          <button onClick={() => navigate("/driver/add")}
            className="h-full px-4 sm:px-7 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-100 transition-all font-bold flex items-center gap-2 text-sm">
            <Plus size={17} /><span className="hidden sm:inline">Add Member</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* SEARCH + VIEW TOGGLE */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 sm:gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={17} />
          <input type="text" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-9 py-3 sm:py-4 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none font-semibold text-slate-700 transition-all text-sm" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"><X size={15} /></button>}
        </div>
        <div className="hidden lg:flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm gap-0.5 shrink-0">
          <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode("table")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
        </div>
      </motion.div>

      {/* CONTENT */}
      {loading && drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-11 h-11 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading...</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {drivers.map(driver => (
                  <motion.div layout key={driver._id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .97 }}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/60 hover:border-slate-200 transition-all flex flex-col group overflow-hidden">

                    <div className="p-5 pb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar: photo or gradient initial */}
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 ${!driver.imageUrl ? `bg-gradient-to-br ${getAvatarColor(driver.name || 'A')} flex items-center justify-center` : 'bg-slate-100'}`}>
                          {driver.imageUrl
                            ? <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" alt={driver.name} />
                            : <span className="text-white font-black text-lg uppercase">{(driver.name || 'A').charAt(0)}</span>}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-800 text-sm sm:text-base truncate max-w-[130px] sm:max-w-[150px] group-hover:text-indigo-600 transition-colors" title={driver.name}>{driver.name}</h3>
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-500 font-bold text-[9px] sm:text-[10px] uppercase rounded-full mt-1 border border-indigo-100">{driver.staffRole || "Personnel"}</span>
                        </div>
                      </div>

                      {/* 3-dot menu with Edit Profile + Delete */}
                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setActiveMenu(activeMenu === driver._id ? null : driver._id)} className="p-1.5 text-slate-300 hover:text-slate-600 bg-slate-50 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {activeMenu === driver._id && (
                            <motion.div initial={{ opacity: 0, y: 6, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .95 }}
                              className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-1.5">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/driver/view/${obfuscate(driver.userid)}`); }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5"><ExternalLink size={13} className="text-indigo-400" /> View Profile</button>
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/driver/add?edit=${obfuscate(driver.userid)}`); }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5"><Pencil size={13} className="text-blue-400" /> Edit Profile</button>
                              <button onClick={(e) => handleDeleteUser(e, driver.userid)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5"><Trash2 size={13} className="text-red-400" /> Delete</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="px-5 space-y-2 pb-5">
                      {/* Email */}
                      <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2.5 rounded-xl group-hover:bg-slate-100/60 transition-colors overflow-hidden">
                        <Mail size={12} className="text-slate-400 shrink-0" /><span className="text-xs font-semibold text-slate-500 truncate">{driver.email || "No Email"}</span>
                      </div>
                      {/* Phone */}
                      <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2.5 rounded-xl group-hover:bg-slate-100/60 transition-colors overflow-hidden">
                        <Phone size={12} className="text-slate-400 shrink-0" /><span className="text-xs font-semibold text-slate-500 truncate">{driver.phoneNumber || "No Phone"}</span>
                      </div>
                      {/* Status */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${driver.status === 'Inactive' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${driver.status === 'Inactive' ? 'bg-amber-400' : 'bg-emerald-500'}`} />{driver.status || "Active"}
                      </div>
                      {/* CTA */}
                      <button onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)}
                        className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-1.5 group/btn">
                        View Profile <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[580px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Designation</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/60">
                    {drivers.map(driver => (
                      <tr key={driver._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 ${!driver.imageUrl ? `bg-gradient-to-br ${getAvatarColor(driver.name || 'A')} flex items-center justify-center` : 'bg-slate-100'}`}>
                              {driver.imageUrl ? <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" alt={driver.name} /> : <span className="text-white font-black text-sm uppercase">{(driver.name || 'A').charAt(0)}</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate max-w-[160px] group-hover:text-indigo-600 transition-colors" title={driver.name}>{driver.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">#{driver.userid?.toString().slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">{driver.staffRole || "Personnel"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            {driver.email && <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><Mail size={11} className="text-slate-300 shrink-0" /><span className="truncate max-w-[140px]">{driver.email}</span></p>}
                            {driver.phoneNumber && <p className="text-xs text-slate-400 flex items-center gap-2"><Phone size={11} className="text-slate-300 shrink-0" />{driver.phoneNumber}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${driver.status === 'Inactive' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                            <span className="text-xs font-black text-slate-600">{driver.status || "Active"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all" title="View"><ExternalLink size={14} /></button>
                            <button onClick={(e) => handleDeleteUser(e, driver.userid)} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {drivers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-5"><Search size={36} className="text-slate-200" /></div>
              <h2 className="text-xl font-black text-slate-700">No Records Found</h2>
              <p className="text-slate-400 text-sm mt-1">Try a different search.</p>
              <button onClick={() => setSearch("")} className="mt-6 px-7 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 text-sm">Clear Search</button>
            </div>
          )}

          <div ref={sentinelRef} className="h-8" />
          {loading && drivers.length > 0 && <div className="flex justify-center py-5"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>}
          {!hasMore && drivers.length > 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-3">All {totalItems} staff loaded</p>}
        </>
      )}
    </div>
  );
};

export default Staff;