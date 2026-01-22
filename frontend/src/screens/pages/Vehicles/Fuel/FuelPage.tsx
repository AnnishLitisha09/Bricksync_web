import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFuelStore } from "../../../../store/useFuelStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";
import { Search } from "lucide-react";

export default function FuelPage() {
  const navigate = useNavigate();

  const { fuels, getFuels, loading, toggleFuelStatus } = useFuelStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    vehicleId: "",
    status: "", // "verified" | "not_verified"
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    getFuels();
    fetchVehicles();
  }, [getFuels, fetchVehicles]);

  const statusStyles: Record<"verified" | "not_verified", string> = {
    verified: "bg-green-100 text-green-700",
    not_verified: "bg-red-100 text-red-700",
  };

  // 🔍 FILTER + SEARCH LOGIC
  const filteredFuels = fuels.filter((fuel) => {
    let match = true;

    if (search) {
      match =
        fuel.vehicle.vehicleNumber
          .toLowerCase()
          .includes(search.toLowerCase()) || false;
    }

    if (filters.vehicleId) {
      match = match && fuel.vehicle.id === Number(filters.vehicleId);
    }

    if (filters.status) {
      match = match && fuel.status === filters.status;
    }

    if (filters.startDate && filters.endDate) {
      const fuelDate = new Date(fuel.date).getTime();
      const start = new Date(filters.startDate).getTime();
      const end = new Date(filters.endDate).getTime();
      match = match && fuelDate >= start && fuelDate <= end;
    }

    return match;
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Fuel Records</h1>
        <button
          onClick={() => navigate("/vehicles/fuel/add")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          + Add Fuel Record
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Vehicle Number..."
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
            <label className="text-sm text-gray-600">Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="not_verified">Not Verified</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {/* FUEL TABLE */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left">Fuel ID</th>
              <th className="px-6 py-4 text-left">Vehicle</th>
              <th className="px-6 py-4 text-left">Bunk</th>
              <th className="px-6 py-4 text-left">Volume</th>
              <th className="px-6 py-4 text-left">Amount</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  Loading fuel records...
                </td>
              </tr>
            ) : filteredFuels.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No fuel records found
                </td>
              </tr>
            ) : (
              filteredFuels.map((fuel) => (
                <tr key={fuel.fuelId} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{fuel.fuelId}</td>
                  <td className="px-6 py-4 font-medium">
                    {fuel.vehicle.vehicleNumber}
                  </td>
                  <td className="px-6 py-4">{fuel.bunk.bunkName}</td>
                  <td className="px-6 py-4">{fuel.volume} L</td>
                  <td className="px-6 py-4 font-semibold">₹ {fuel.amount}</td>
                  <td className="px-6 py-4">
                    {new Date(fuel.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusStyles[fuel.status ?? "not_verified"]
                      }`}
                      onClick={() => toggleFuelStatus(fuel.fuelId)}
                    >
                      {fuel.status === "verified"
                        ? "Verified"
                        : "Not Verified"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-orange-500 hover:underline">
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
