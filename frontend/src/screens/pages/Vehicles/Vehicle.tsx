import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Calendar, Car, Check, ChevronLeft, ChevronRight, Gauge, Plus, Search, Sliders } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import { encryptId } from "../../../utils/functions";
import { useVehicleStore, type Vehicle } from "../../../store/vechicle/useVehicleStore";
import { formatDate } from "../../../utils/formatDate";

// --- Logic Helpers ---
const getDetailedStatus = (v: Vehicle) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date();
  target.setDate(target.getDate() + 5);
  target.setHours(23, 59, 59, 999);

  const docs = [
    { label: "Insurance", date: v.insurance },
    { label: "Pollution", date: v.pollution },
    { label: "RC", date: v.rcDate },
  ];

  const expired = docs.filter(d => d.date && new Date(d.date) < today);
  const expiringSoon = docs.filter(d => d.date && new Date(d.date) >= today && new Date(d.date) <= target);

  if (expired.length > 0) return { label: "EXPIRED", color: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", items: expired.map(e => e.label) };
  if (expiringSoon.length > 0) return { label: "EXPIRING SOON", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", items: expiringSoon.map(e => e.label) };
  return { label: "ALL CLEAR", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", items: [] };
};

const getStatus = (vehicle: Vehicle) => {
  if (!vehicle.insurance || !vehicle.pollution || !vehicle.rcDate) return "Inactive";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    new Date(vehicle.insurance) >= today &&
    new Date(vehicle.pollution) >= today &&
    new Date(vehicle.rcDate) >= today
  ) ? "Active" : "Inactive";
};

const statusStyles = {
  Active: "bg-emerald-50/90 text-emerald-700 border-emerald-200/50",
  Inactive: "bg-rose-50/90 text-rose-700 border-rose-200/50",
};

// --- Skeleton Loading Component ---
const VehicleSkeleton = () => (
  <div className="flex flex-col lg:flex-row bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 animate-pulse mb-6">
    <div className="w-full lg:w-96 h-64 bg-gray-200" />
    <div className="flex-1 p-8 space-y-6">
      <div className="h-8 w-1/3 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
      </div>
      <div className="h-12 w-32 bg-gray-100 rounded-2xl ml-auto" />
    </div>
  </div>
);

export default function VehicleList() {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles, loading, error } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<("Active" | "Inactive")[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const status = getStatus(v);
      const matchesSearch = (v.vehicleNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.vehicleName ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, selectedStatuses]);

  if (error) return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="p-12 bg-white rounded-[3rem] border-2 border-rose-100 flex flex-col items-center text-center gap-6 shadow-2xl shadow-rose-50">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-gray-900 uppercase">Synchronization Error</h3>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest px-8">We couldn't connect to the fleet registry. Check your connection.</p>
        </div>
        <button onClick={() => fetchVehicles()} className="px-10 py-4 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-orange-500 transition-all shadow-xl shadow-gray-200">Retry Sync</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Registry <span className="text-orange-500">Fleet</span>
          </h1>
          <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {vehicles.length} Assets Registered
          </p>
        </div>

        <button
          onClick={() => navigate("/add-vehicle")}
          className="group flex items-center justify-center bg-orange-600 text-white w-14 h-14 md:w-auto md:px-8 md:py-5 rounded-2xl md:rounded-[2rem] transition-all shadow-2xl shadow-orange-100 hover:bg-gray-900 active:scale-95"
        >
          <Plus className="w-6 h-6 md:w-5 md:h-5 group-hover:rotate-90 transition-transform" />
          <span className="hidden md:block font-black uppercase tracking-widest text-xs ml-3">Register Vehicle</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5 group-focus-within:text-orange-500 transition-all" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-sm md:text-base shadow-sm group-hover:border-orange-200 transition-all placeholder:text-gray-300"
          />
        </div>

        <div className="relative flex gap-3" ref={filterRef}>
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`flex items-center justify-center flex-1 md:w-auto md:px-10 py-5 rounded-[2rem] border transition-all font-black uppercase tracking-widest text-[10px] ${showFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-100 shadow-sm"
              }`}
          >
            <Sliders size={18} className="mr-3" />
            Filter
          </button>

          {showFilter && (
            <div className="absolute right-0 top-full mt-4 w-56 bg-white border border-gray-50 rounded-[2.5rem] shadow-2xl z-20 p-4 animate-in slide-in-from-top-4">
              <p className="text-[10px] font-black uppercase text-gray-400 mb-3 px-2 tracking-widest">Status Logic</p>
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    const s = status as "Active" | "Inactive";
                    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-4 rounded-2xl transition-all mb-1 ${selectedStatuses.includes(status as any) ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                >
                  <span className={`font-black text-[11px] uppercase tracking-widest ${selectedStatuses.includes(status as any) ? 'text-orange-600' : 'text-gray-600'}`}>{status}</span>
                  {selectedStatuses.includes(status as any) && <Check size={14} className="text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHICLE TABLE */}
      <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asset</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Insurance</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pollution</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">RC Date</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Kilometer</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Spend</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-8 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-100 rounded" />
                          <div className="h-3 w-20 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-8 px-8"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="py-8 px-8"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="py-8 px-8"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="py-8 px-8"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                    <td className="py-8 px-8"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="py-8 px-8"><div className="h-10 w-10 bg-gray-100 rounded-full mx-auto" /></td>
                  </tr>
                ))
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((v, index) => {
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={v.id}
                      className="group hover:bg-orange-50/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/view-vehicle/${encryptId(v.id)}`)}
                    >
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-5">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm group-hover:border-orange-200 transition-all">
                            <img
                              src={v.vehicleImage ? `${FILE_BASE_URL}${v.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=100"}
                              alt={v.vehicleName}
                              className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter group-hover:text-orange-600 transition-colors">
                              {v.vehicleName}
                            </h3>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mt-0.5">{v.vehicleNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <SimpleComplianceBadge date={v.insurance} />
                      </td>
                      <td className="py-6 px-8">
                        <SimpleComplianceBadge date={v.pollution} />
                      </td>
                      <td className="py-6 px-8">
                        <SimpleComplianceBadge date={v.rcDate} />
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <Gauge size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                          <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">
                            {v.kilometer || 0} KM
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                            ₹ {(v.totalCost || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <button
                          className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-95 group/btn"
                        >
                          <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mx-auto mb-4 shadow-sm border border-gray-100">
                      <Car size={32} />
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">No registry entries matching criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">
        Total {filteredVehicles.length} vehicles indexed in fleet registry
      </p>
    </div>
  );
}

const SimpleComplianceBadge = ({ date }: { date: string | null }) => {
  const isExpired = date && new Date(date) < new Date();
  if (!date) return <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">Not Defined</span>;

  return (
    <span className={`text-[11px] font-black uppercase tracking-tight ${isExpired ? 'text-rose-600 font-black' : 'text-gray-600'}`}>
      {formatDate(date)}
    </span>
  );
};