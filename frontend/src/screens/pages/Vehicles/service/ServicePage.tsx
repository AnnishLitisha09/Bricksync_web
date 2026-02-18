import { 
  Calendar, ChevronRight, CreditCard, Filter, 
  MapPin, Plus, Search, Wrench 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleServiceStore } from "../../../../store/useVehicleServiceStore";
import { useVehicleStore } from "../../../../store/vechicle/useVehicleStore";

export default function ServicePage() {
  const navigate = useNavigate();
  const { services, fetchServices, loading } = useVehicleServiceStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    vehicleId: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchServices(); // Defaults to page 1
    fetchVehicles();
  }, [fetchServices, fetchVehicles]);

  const filteredServices = services.filter((service) => {
    let match = true;
    if (search) {
      const s = search.toLowerCase();
      match = service.serviceShop.shop_name.toLowerCase().includes(s) ||
              service.vehicle.vehicleNumber.toLowerCase().includes(s) ||
              service.serviceShop.phone?.includes(s);
    }
    if (filters.vehicleId) match = match && service.vehicle.id === Number(filters.vehicleId);
    if (filters.type) match = match && service.serviceShop.type === filters.type;
    
    if (filters.startDate && filters.endDate) {
      const sDate = new Date(service.date).getTime();
      match = match && sDate >= new Date(filters.startDate).getTime() && 
                      sDate <= new Date(filters.endDate).getTime();
    }
    return match;
  });

  const typeStyles: Record<string, string> = {
    showroom: "bg-blue-100 text-blue-700 border-blue-200",
    paint: "bg-purple-100 text-purple-700 border-purple-200",
    tyre: "bg-emerald-100 text-emerald-700 border-emerald-200",
    others: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            SERVICE <span className="text-orange-600">RECORDS</span>
          </h1>
          <p className="text-slate-500 text-sm">Track maintenance history</p>
        </div>
        <button
          onClick={() => navigate("/vehicles/services/add")}
          className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all active:scale-95"
        >
          <Plus size={20} /> Add Service
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-[10px] font-bold uppercase">Total Records</p>
          <div className="flex items-center gap-2 mt-1">
            <Wrench className="text-orange-500" size={18} />
            <span className="text-lg font-bold text-slate-800">{filteredServices.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-[10px] font-bold uppercase">Total Spent</p>
          <div className="flex items-center gap-2 mt-1">
            <CreditCard className="text-green-500" size={18} />
            <span className="text-lg font-bold text-slate-800">
              ₹{filteredServices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              showFilter ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Filter size={18} /> {showFilter ? "Close" : "Filters"}
          </button>
        </div>

        {showFilter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dashed">
             <select
                value={filters.vehicleId}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                className="bg-gray-50 border-none rounded-lg p-2 text-sm"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
              {/* Add Date Inputs here same as your original code */}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px]">
            <tr>
              <th className="px-6 py-4 text-left">Vehicle & Shop</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Amount</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center animate-pulse">Loading...</td></tr>
            ) : filteredServices.map((service) => (
              <tr key={service.id} className="hover:bg-orange-50/30">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-700">{service.vehicle.vehicleNumber}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin size={10} /> {service.serviceShop.shop_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${typeStyles[service.serviceShop.type] || typeStyles.others}`}>
                    {service.serviceShop.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold">₹{service.amount}</td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(service.date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => navigate(`/vehicles/services/${service.id}`)} className="text-orange-600">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Fallback for empty state */}
      {!loading && filteredServices.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-gray-400">No service records found.</p>
        </div>
      )}
    </div>
  );
}