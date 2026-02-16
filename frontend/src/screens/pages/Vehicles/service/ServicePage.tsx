import {
  Calendar,
  ChevronRight,
  CreditCard,
  Filter,
  MapPin,
  Plus,
  Search,
  Wrench
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleServiceStore } from "../../../../store/useVehicleServiceStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";

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
    fetchServices();
    fetchVehicles();
  }, [fetchServices, fetchVehicles]);

  // 🔍 FILTER + SEARCH LOGIC
  const filteredServices = services.filter((service) => {
    let match = true;

    if (search) {
      match =
        service.serviceShop.shop_name.toLowerCase().includes(search.toLowerCase()) ||
        service.serviceShop.owner.toLowerCase().includes(search.toLowerCase()) ||
        service.serviceShop.phone.includes(search) ||
        service.vehicle.vehicleNumber.toLowerCase().includes(search.toLowerCase());
    }

    if (filters.vehicleId) {
      match = match && service.vehicle.id === Number(filters.vehicleId);
    }

    if (filters.type) {
      match = match && service.serviceShop.type === filters.type;
    }

    if (filters.startDate && filters.endDate) {
      const serviceDate = new Date(service.date).getTime();
      const start = new Date(filters.startDate).getTime();
      const end = new Date(filters.endDate).getTime();
      match = match && serviceDate >= start && serviceDate <= end;
    }

    return match;
  });

  const typeStyles = {
    showroom: "bg-blue-100 text-blue-700 border-blue-200",
    paint: "bg-purple-100 text-purple-700 border-purple-200",
    tyre: "bg-emerald-100 text-emerald-700 border-emerald-200",
    others: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            SERVICE <span className="text-orange-600">RECORDS</span>
          </h1>
          <p className="text-slate-500 text-sm">Track maintenance history and shop expenses</p>
        </div>
        <button
          onClick={() => navigate("/vehicles/services/add")}
          className="flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Services</p>
          <div className="flex items-center gap-2 mt-1">
            <Wrench className="text-orange-500" size={18} />
            <span className="text-lg font-bold text-slate-800">{filteredServices.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Total Spent</p>
          <div className="flex items-center gap-2 mt-1">
            <CreditCard className="text-green-500" size={18} />
            <span className="text-lg font-bold text-slate-800">
              ₹{filteredServices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by vehicle, shop, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              showFilter ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
            {showFilter ? "Close Filters" : "Filters"}
          </button>
        </div>

        {showFilter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dashed">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Vehicle</label>
              <select
                value={filters.vehicleId}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Service Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Types</option>
                <option value="showroom">Showroom</option>
                <option value="paint">Paint</option>
                <option value="tyre">Tyre</option>
                <option value="others">Others</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Vehicle & Shop</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Amount</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-6 border-b border-gray-50">
                    <div className="h-4 bg-gray-100 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gray-400">No records found.</td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-orange-50/30 transition-colors">
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
                  <td className="px-6 py-4 font-bold text-slate-800">₹{service.amount}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(service.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 border border-green-200">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/vehicles/services/${service.id}`)}
                      className="p-2 hover:bg-white rounded-full text-orange-600 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-400 animate-pulse">Loading records...</div>
        ) : filteredServices.map((service) => (
          <div key={service.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">#{service.id}</span>
                <h3 className="text-lg font-black text-slate-800">{service.vehicle.vehicleNumber}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                   <MapPin size={12} /> {service.serviceShop.shop_name}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${typeStyles[service.serviceShop.type] || typeStyles.others}`}>
                {service.serviceShop.type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 py-3 border-y border-dashed border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Total Bill</p>
                <p className="font-bold text-slate-700">₹{service.amount}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Status</p>
                <p className="text-green-600 font-bold text-xs uppercase">Completed</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <Calendar size={14} />
                {new Date(service.date).toLocaleDateString()}
              </div>
              <button 
                onClick={() => navigate(`/vehicles/services/${service.id}`)}
                className="text-orange-600 font-bold text-sm flex items-center gap-1"
              >
                View <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filteredServices.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No service history found matching your search.</p>
        </div>
      )}
    </div>
  );
}