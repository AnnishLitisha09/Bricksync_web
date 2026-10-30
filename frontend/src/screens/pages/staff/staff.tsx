import {
  ExternalLink, Mail, MoreVertical, Phone, Plus, Search, ShieldCheck,
  Trash2, X, LayoutGrid, List, Loader2, ChevronRight, Pencil, Users,
  Truck, Wrench, CheckCircle2, UserCheck
} from "lucide-react";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  "from-indigo-600 to-indigo-700",
  "from-violet-600 to-purple-700",
  "from-blue-600 to-cyan-700",
  "from-emerald-600 to-teal-700",
  "from-rose-600 to-pink-700",
  "from-amber-600 to-orange-700",
];
const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const LIMIT = 12;

const Staff: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
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
    } catch (e) {
      console.error("Fetch drivers error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      fetchDrivers(1, search, false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    await fetchDrivers(next, search, true);
  }, [loading, hasMore, currentPage, search]);

  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMoreRef.current(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleDeleteUser = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this staff record? Associated logs will be archived.")) return;
    const res = await fetch(`${BASE_URL}/user/${id}`, { method: 'DELETE', headers: getAuthHeader() });
    if (res.ok) {
      setDrivers(drivers.filter(d => d.userid !== id) as DriverType[]);
      setActiveMenu(null);
    }
  };

  // Filtered by role
  const filteredDrivers = useMemo(() => {
    if (roleFilter === "ALL") return drivers;
    if (roleFilter === "ACTIVE") return drivers.filter(d => d.status !== "Inactive");
    if (roleFilter === "DRIVER") return drivers.filter(d => (d.staffRole || "").toLowerCase().includes("driver"));
    if (roleFilter === "STAFF") return drivers.filter(d => !(d.staffRole || "").toLowerCase().includes("driver"));
    return drivers;
  }, [drivers, roleFilter]);

  // Quick stats
  const activeCount = useMemo(() => drivers.filter(d => d.status !== "Inactive").length, [drivers]);
  const driverCount = useMemo(() => drivers.filter(d => (d.staffRole || "").toLowerCase().includes("driver")).length, [drivers]);

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 rounded-full text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
              <ShieldCheck size={11} /> Verified Workforce
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {totalItems} Enrolled Members
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Personnel <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Centralized registry for plant drivers, mechanics, dispatch crew & support staff
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/driver/add")}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* ── QUICK STATS PILLS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Workforce</p>
            <p className="text-lg font-black text-slate-900 tabular-nums">{totalItems}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active On Duty</p>
            <p className="text-lg font-black text-emerald-600 tabular-nums">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Fleet Drivers</p>
            <p className="text-lg font-black text-slate-900 tabular-nums">{driverCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Operations & Crew</p>
            <p className="text-lg font-black text-slate-900 tabular-nums">{Math.max(0, totalItems - driverCount)}</p>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              roleFilter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Staff
          </button>
          <button
            onClick={() => setRoleFilter("DRIVER")}
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              roleFilter === "DRIVER"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
            }`}
          >
            <Truck size={13} />
            Drivers
          </button>
          <button
            onClick={() => setRoleFilter("STAFF")}
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              roleFilter === "STAFF"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
            }`}
          >
            <Wrench size={13} />
            Plant Staff
          </button>
          <button
            onClick={() => setRoleFilter("ACTIVE")}
            className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              roleFilter === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
            }`}
          >
            <CheckCircle2 size={13} />
            Active Only
          </button>
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white shadow-2xs transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="hidden sm:flex bg-slate-100 h-9 p-1 rounded-xl shrink-0 items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {loading && drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Loading Personnel Registry...</p>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredDrivers.map(driver => {
                  const isInactive = driver.status === 'Inactive';
                  const isDriver = (driver.staffRole || "").toLowerCase().includes("driver");

                  return (
                    <motion.div
                      layout
                      key={driver._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-indigo-300 transition-all flex flex-col justify-between group overflow-hidden"
                    >
                      {/* Top Header */}
                      <div className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar with status ring */}
                            <div className="relative shrink-0">
                              <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-2xs ${
                                !driver.imageUrl
                                  ? `bg-gradient-to-br ${getAvatarColor(driver.name || 'A')} flex items-center justify-center text-white font-black text-lg`
                                  : 'bg-slate-100'
                              }`}>
                                {driver.imageUrl ? (
                                  <img
                                    src={`${FILE_BASE_URL}${driver.imageUrl}`}
                                    className="w-full h-full object-cover"
                                    alt={driver.name}
                                  />
                                ) : (
                                  <span>{(driver.name || 'A').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  isInactive ? "bg-amber-400" : "bg-emerald-500"
                                }`}
                              />
                            </div>

                            <div className="min-w-0">
                              <h3
                                className="font-black text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-indigo-600 transition-colors"
                                title={driver.name}
                              >
                                {driver.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                  isDriver
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "bg-purple-50 text-purple-700 border border-purple-100"
                                }`}>
                                  {driver.staffRole || "Personnel"}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  #{driver.userid}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 3-Dot Menu */}
                          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveMenu(activeMenu === driver._id ? null : driver._id)}
                              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                            <AnimatePresence>
                              {activeMenu === driver._id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                  className="absolute right-0 mt-1 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden"
                                >
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/driver/view/${obfuscate(driver.userid)}`); }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink size={13} className="text-indigo-600" />
                                    <span>View Profile & Ledger</span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/driver/add?edit=${obfuscate(driver.userid)}`); }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Pencil size={13} className="text-blue-600" />
                                    <span>Edit Credentials</span>
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={(e) => handleDeleteUser(e, driver.userid)}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                    <span>Delete Staff</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="px-5 space-y-2 pb-4">
                        <div className="flex items-center gap-2.5 bg-slate-50/70 hover:bg-slate-100/70 px-3 py-2 rounded-xl transition-colors border border-slate-100">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {driver.phoneNumber || "No Phone Recorded"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 bg-slate-50/70 hover:bg-slate-100/70 px-3 py-2 rounded-xl transition-colors border border-slate-100">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {driver.email || "No Email Address"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            isInactive ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {isInactive ? "Inactive / On Leave" : "Active on Duty"}
                          </span>
                        </div>
                      </div>

                      {/* Action Button Footer */}
                      <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)}
                          className="flex-1 h-9 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs group/btn cursor-pointer"
                        >
                          <span>View Profile</span>
                          <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                          onClick={() => navigate(`/driver/add?edit=${obfuscate(driver.userid)}`)}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Edit Profile"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === "table" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">
                        Designation
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Contact Details
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDrivers.map(driver => (
                      <tr key={driver._id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 ${
                              !driver.imageUrl
                                ? `bg-gradient-to-br ${getAvatarColor(driver.name || 'A')} flex items-center justify-center text-white font-black text-sm`
                                : 'bg-slate-100'
                            }`}>
                              {driver.imageUrl ? (
                                <img src={`${FILE_BASE_URL}${driver.imageUrl}`} className="w-full h-full object-cover" alt={driver.name} />
                              ) : (
                                <span>{(driver.name || 'A').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate max-w-[160px] group-hover:text-indigo-600 transition-colors">
                                {driver.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">
                                ID: #{driver.userid}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                            {driver.staffRole || "Personnel"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {driver.phoneNumber && (
                              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Phone size={11} className="text-slate-400 shrink-0" />
                                {driver.phoneNumber}
                              </p>
                            )}
                            {driver.email && (
                              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Mail size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{driver.email}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            driver.status === 'Inactive' ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${driver.status === 'Inactive' ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {driver.status || "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/driver/view/${obfuscate(driver.userid)}`)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer"
                              title="View Profile"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={() => navigate(`/driver/add?edit=${obfuscate(driver.userid)}`)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all cursor-pointer"
                              title="Edit Credentials"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteUser(e, driver.userid)}
                              className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredDrivers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
                <Users size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Personnel Records</h3>
              <p className="text-slate-400 font-medium text-xs max-w-sm text-center mt-1">
                {search
                  ? "No staff members matched your search criteria."
                  : "No staff members registered under this filter."}
              </p>
              {(search || roleFilter !== "ALL") && (
                <button
                  onClick={() => { setSearch(""); setRoleFilter("ALL"); }}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Sentinel & Loaders */}
          <div ref={sentinelRef} className="h-4" />
          {loading && drivers.length > 0 && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-indigo-600" size={20} />
            </div>
          )}
          {!hasMore && drivers.length > 0 && (
            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">
              All {totalItems} personnel records loaded
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Staff;
