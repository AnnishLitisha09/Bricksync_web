import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Calendar, Car, Check, ChevronLeft, ChevronRight, Gauge, Plus, Search, Sliders } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import { encryptId } from "../../../utils/functions";
import { useVehicleStore, type Vehicle } from "../../../store/vechicle/useVehicleStore";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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

  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVehicles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVehicles, currentPage]);

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatuses]);

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

      {/* VEHICLE LIST */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          [1, 2, 3].map((i) => <VehicleSkeleton key={i} />)
        ) : paginatedVehicles.length > 0 ? (
          paginatedVehicles.map((v, index) => {
            const status = getStatus(v);
            const detailed = getDetailedStatus(v);
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={v.id}
                className="group flex flex-col md:flex-row bg-white rounded-[3rem] overflow-hidden border border-gray-50 shadow-2xl shadow-gray-100/50 hover:border-orange-200 hover:shadow-orange-100 transition-all duration-500"
              >
                {/* Image Section */}
                <div className="relative w-full md:w-80 lg:w-[28rem] h-56 md:h-auto overflow-hidden bg-gray-50">
                  <img
                    src={v.vehicleImage ? `${FILE_BASE_URL}${v.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"}
                    alt={v.vehicleName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black border backdrop-blur-xl shadow-xl flex items-center gap-2 ${statusStyles[status]}`}>
                      <div className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                      {status.toUpperCase()}
                    </span>

                    {detailed.items.length > 0 && (
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black border backdrop-blur-xl shadow-xl ${detailed.text} ${detailed.bg} border-${detailed.text.split('-')[1]}-200/50`}>
                        {detailed.label} ({detailed.items.join(", ")})
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-white relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Car size={160} className="text-gray-900 group-hover:text-orange-500 transition-colors" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none group-hover:text-orange-600 transition-colors">
                          {v.vehicleName}
                        </h2>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">{v.vehicleNumber}</p>
                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{v.kilometer || 0} KM TRACKED</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 mt-8">
                      <InfoIcon label="Insurance" value={v.insurance} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Pollution" value={v.pollution} icon={<AlertCircle className="w-4 h-4" />} />
                      <InfoIcon label="RC Expiry" value={v.rcDate} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Configuration" value="Heavy Duty" icon={<Gauge className="w-4 h-4" />} />
                    </div>
                  </div>

                  <div className="mt-10 md:mt-0 flex items-center justify-end relative z-10">
                    <button
                      onClick={() => navigate(`/view-vehicle/${encryptId(v.id)}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-[2rem] font-black tracking-widest text-[10px] hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-200 transition-all group/btn active:scale-95 uppercase"
                    >
                      Protocol Details
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-gray-50 rounded-[4rem] border-4 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-200 mx-auto mb-6 shadow-sm">
              <Car size={40} />
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em]">No Assets Found In Current Filter</p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-12 border-t border-gray-50 mt-12">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] text-center sm:text-left">
            Displaying Index {((currentPage - 1) * itemsPerPage) + 1}—{Math.min(currentPage * itemsPerPage, filteredVehicles.length)} of {filteredVehicles.length}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-14 h-14 bg-white rounded-2xl border border-gray-100 text-gray-400 disabled:opacity-20 hover:text-orange-500 hover:border-orange-200 transition-all flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-14 h-14 rounded-2xl text-[10px] font-black transition-all ${currentPage === page
                    ? "bg-orange-600 text-white shadow-2xl shadow-orange-100 border-orange-500"
                    : "bg-white text-gray-400 border border-gray-100 hover:border-orange-500 hover:text-orange-500 shadow-sm"
                    }`}
                >
                  {String(page).padStart(2, '0')}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-14 h-14 bg-white rounded-2xl border border-gray-100 text-gray-400 disabled:opacity-20 hover:text-orange-500 hover:border-orange-200 transition-all flex items-center justify-center shadow-sm"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoIcon = ({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) => (
  <div className="space-y-2 group/icon">
    <div className="flex items-center gap-2 text-gray-300 group-hover/icon:text-orange-400 transition-colors">
      <div className="p-1.5 bg-gray-50 rounded-lg">{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-[13px] font-black uppercase tracking-tighter ${!value ? 'text-gray-300' : 'text-gray-700'}`}>
      {value ? (value.length > 15 ? value.slice(0, 15) + "..." : value) : "Not Defined"}
    </p>
  </div>
);