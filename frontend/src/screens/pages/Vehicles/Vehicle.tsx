import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore, type Vehicle } from "../../../store/useVehicleStore";
import { FILE_BASE_URL } from "../../../api/base";
import { Sliders, Check, Eye, Search, Plus, Calendar, Gauge, AlertCircle, ArrowRight, Car } from "lucide-react";
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
  Active: "bg-emerald-50/90 text-emerald-700 border-emerald-200/50",
  Inactive: "bg-rose-50/90 text-rose-700 border-rose-200/50",
};

// --- Skeleton Loading Component ---
const VehicleSkeleton = () => (
  <div className="flex flex-col lg:flex-row bg-white rounded-[2rem] overflow-hidden border border-gray-100 animate-pulse mb-4">
    <div className="w-full lg:w-80 h-48 lg:h-64 bg-gray-200" />
    <div className="flex-1 p-6 space-y-4">
      <div className="h-6 w-1/2 bg-gray-200 rounded-lg" />
      <div className="h-10 w-full bg-gray-100 rounded-xl" />
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="p-8 bg-white rounded-[2rem] border-2 border-rose-100 flex flex-col items-center text-center gap-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-xl font-black text-gray-900">Sync Error</h3>
        <button onClick={() => fetchVehicles()} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight uppercase">
            My <span className="text-orange-500">Fleet</span>
          </h1>
          <p className="text-gray-400 text-[10px] md:text-sm font-bold uppercase tracking-widest">{vehicles.length} Total Assets</p>
        </div>
        
        <button
          onClick={() => navigate("/add-vehicle")}
          className="flex items-center justify-center bg-orange-500 text-white w-12 h-12 md:w-auto md:px-6 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-orange-100 active:scale-95"
        >
          <Plus className="w-6 h-6 md:w-5 md:h-5" />
          <span className="hidden md:block font-bold ml-2">Add Vehicle</span>
        </button>
      </div>

      {/* SEARCH & FILTERS - Optimized for single line on mobile */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 md:py-4 bg-white border border-gray-100 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-orange-500/10 outline-none font-medium text-sm md:text-base shadow-sm transition-all"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`flex items-center justify-center w-12 h-12 md:w-auto md:px-6 md:py-4 rounded-xl md:rounded-2xl border transition-all font-bold ${
              showFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-100 shadow-sm"
            }`}
          >
            <Sliders className="w-5 h-5 md:w-4 md:h-4" />
            <span className="hidden md:block ml-2">Filter</span>
          </button>

          {showFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 p-2 animate-in slide-in-from-top-2">
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    const s = status as "Active" | "Inactive";
                    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  <span className="font-bold text-sm text-gray-700">{status}</span>
                  {selectedStatuses.includes(status as any) && <Check className="w-4 h-4 text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHICLE LIST */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3].map((i) => <VehicleSkeleton key={i} />)
        ) : filteredVehicles.length > 0 ? (
          filteredVehicles.map((v) => {
            const status = getStatus(v);
            return (
              <div
                key={v.id}
                className="group flex flex-col md:flex-row bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:border-orange-200 transition-all duration-300"
              >
                {/* Image Section */}
                <div className="relative w-full md:w-72 lg:w-96 h-44 md:h-auto overflow-hidden">
                  <img
                    src={v.vehicleImage ? `${FILE_BASE_URL}${v.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"}
                    alt={v.vehicleName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border backdrop-blur-md shadow-sm ${statusStyles[status]}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2 md:mb-4">
                      <div className="space-y-0.5">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 group-hover:text-orange-500 transition-colors uppercase">
                          {v.vehicleName}
                        </h2>
                        <p className="text-[10px] md:text-xs font-mono font-bold text-gray-400 tracking-widest">{v.vehicleNumber}</p>
                      </div>
                    </div>

                    {/* HIDDEN ON MOBILE */}
                    <div className="hidden md:grid grid-cols-4 gap-4 mt-6">
                      <InfoIcon label="Insurance" value={v.insurance} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Pollution" value={v.pollution} icon={<AlertCircle className="w-4 h-4" />} />
                      <InfoIcon label="RC Date" value={v.rcDate} icon={<Calendar className="w-4 h-4" />} />
                      <InfoIcon label="Mileage" value={v.kilometer ? `${v.kilometer} km` : "N/A"} icon={<Gauge className="w-4 h-4" />} />
                    </div>
                  </div>

                  <div className="mt-4 md:mt-8 flex items-center justify-end">
                    <button
                      onClick={() => navigate(`/view-vehicle/${encryptId(v.id)}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-50 md:bg-gray-900 text-gray-900 md:text-white px-6 py-4 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-orange-500 hover:text-white transition-all group/btn active:scale-95"
                    >
                      <span className="text-xs md:text-sm">VIEW DETAILS</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <Car className="w-10 h-10 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 text-sm font-bold uppercase">No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
}

const InfoIcon = ({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-gray-400">
      {icon}
      <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-sm font-bold text-gray-700">
      {value ? (value.length > 10 ? value.slice(0, 10) : value) : "N/A"}
    </p>
  </div>
);