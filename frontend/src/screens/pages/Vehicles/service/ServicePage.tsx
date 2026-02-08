import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleServiceStore } from "../../../../store/useVehicleServiceStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";
import { Search } from "lucide-react";

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

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Service Records</h1>
        <button
          onClick={() => navigate("/vehicles/services/add")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          + Add Service
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Vehicle, Shop, or Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-100"
        >
          {showFilter ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* FILTER SECTION */}
      {showFilter && (
        <div className="bg-gray-50 border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600">Vehicle</label>
            <select
              value={filters.vehicleId}
              onChange={(e) =>
                setFilters({ ...filters, vehicleId: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="showroom">Showroom</option>
              <option value="paint">Paint</option>
              <option value="tyre">Tyre</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* SERVICE RECORDS TABLE */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left">ID</th>
              <th className="px-6 py-4 text-left">Vehicle</th>
              <th className="px-6 py-4 text-left">Shop Name</th>
              <th className="px-6 py-4 text-left">Type</th>
              <th className="px-6 py-4 text-left">Amount</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  Loading service records...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No service records found
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{service.id}</td>
                  <td className="px-6 py-4 font-medium">
                    {service.vehicle.vehicleNumber}
                  </td>
                  <td className="px-6 py-4">{service.serviceShop.shop_name}</td>
                  <td className="px-6 py-4">{service.serviceShop.type}</td>
                  <td className="px-6 py-4 font-semibold">₹ {service.amount}</td>
                  <td className="px-6 py-4">
                    {new Date(service.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="text-orange-500 hover:underline"
                      onClick={() =>
                        navigate(`/vehicles/services/${service.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
