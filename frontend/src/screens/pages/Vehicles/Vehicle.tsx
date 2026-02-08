import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore, type Vehicle } from "../../../store/useVehicleStore";
import { FILE_BASE_URL } from "../../../api/base";
import { Sliders, Check, Eye, Search, Plus, Calendar, Gauge, AlertCircle } from "lucide-react";
import { encryptId } from "../../../utils/functions";

// --- Logic Helpers ---
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
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
  Inactive: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
};

// --- Skeleton Loading Component ---
const VehicleSkeleton = () => (
  <div className="flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="w-full lg:w-72 h-48 lg:h-auto bg-gray-200" />
    <div className="flex-1 p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-6 w-24 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-12 bg-gray-100 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-4">
        <div className="h-10 w-32 bg-gray-100 rounded-xl" />
      </div>
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

  const filteredVehicles = vehicles.filter((v) => {
    const status = getStatus(v);
    const matchesSearch = (v.vehicleNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(status);
    return matchesSearch && matchesStatus;
  });

  if (error) return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 flex flex-col items-center text-center gap-4 text-rose-700">
        <div className="p-4 bg-rose-100 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Unable to load fleet</h3>
          <p className="opacity-80 text-sm">{error}</p>
        </div>
        <button onClick={() => fetchVehicles()} className="mt-2 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
          Retry Connection
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Fleet Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Manage and monitor your vehicle compliance.</p>
        </div>
        <button
          onClick={() => navigate("/add-vehicle")}
          className="group flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-orange-200 active:scale-95"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="font-bold">Add Vehicle</span>
        </button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors w-5 h-5" />
          <input
            type="text"
            placeholder="Search by vehicle number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 shadow-sm transition-all outline-none font-medium"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl border transition-all font-bold shadow-sm ${
              showFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Filters
            {selectedStatuses.length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {selectedStatuses.length}
              </span>
            )}
          </button>

          {showFilter && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-3xl shadow-2xl z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-4 py-2">Filter Status</p>
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    const s = status as "Active" | "Inactive";
                    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 rounded-xl transition-colors group"
                >
                  <span className="text-sm font-bold text-gray-700 group-hover:text-orange-700">{status}</span>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedStatuses.includes(status as any) ? "bg-orange-500 border-orange-500" : "bg-gray-50 border-gray-200"
                  }`}>
                    {selectedStatuses.includes(status as any) && <Check className="w-4 h-4 text-white stroke-[3px]" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHICLE LIST */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          // Render multiple skeletons during load
          [1, 2, 3].map((i) => <VehicleSkeleton key={i} />)
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => {
            const status = getStatus(v);
            return (
              <div
                key={v.id}
                className="group flex flex-col lg:flex-row bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-100/50 hover:border-orange-200 transition-all duration-500"
              >
                {/* Image Section */}
                <div className="relative w-full lg:w-80 h-56 lg:h-auto overflow-hidden">
                  <img
                    src={v.vehicleImage ? `${FILE_BASE_URL}${v.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400"}
                    alt={v.vehicleName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-5 left-5">
                    <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black border-2 shadow-lg backdrop-blur-md ${statusStyles[status]}`}>
                      <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-3xl font-black text-gray-800 tracking-tight group-hover:text-orange-600 transition-colors">
                        {v.vehicleName}
                      </h2>
                      <span className="font-mono text-xs font-bold bg-gray-900 text-white px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-gray-200">
                        {v.vehicleNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                      <InfoIcon label="Insurance" value={v.insurance} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Pollution" value={v.pollution} icon={<AlertCircle className="w-4 h-4" />} />
                      <InfoIcon label="Registration" value={v.rcDate} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Mileage" value={v.kilometer ? `${v.kilometer} km` : null} icon={<Gauge className="w-4 h-4" />} />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={() => navigate(`/view-vehicle/${encryptId(v.id)}`)}
                      className="flex items-center gap-2 text-sm font-black text-gray-500 hover:text-orange-600 transition-all px-6 py-3 rounded-2xl hover:bg-orange-50 active:scale-95"
                    >
                      <Eye className="w-5 h-5" />
                      VIEW FULL PROFILE
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100">
            <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50 rotate-3">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">No vehicles found</h3>
            <p className="text-gray-500 font-medium max-w-xs mx-auto mt-2">We couldn't find any vehicles matching your current search or filter criteria.</p>
            <button 
              onClick={() => {setSearchTerm(""); setSelectedStatuses([])}}
              className="mt-6 text-orange-500 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Enhanced Sub-components ---
const InfoIcon = ({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) => (
  <div className="space-y-2 group/info">
    <div className="flex items-center gap-2 text-gray-400 group-hover/info:text-orange-400 transition-colors">
      <div className="p-1.5 bg-gray-50 rounded-lg group-hover/info:bg-orange-50 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</p>
    </div>
    <p className="text-[15px] font-bold text-gray-700 pl-1">{value ? value.slice(0, 10) : "Not Set"}</p>
  </div>
);