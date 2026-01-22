import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // ✅ navigation
import { useVehicleStore, type Vehicle } from "../../../store/useVehicleStore";
import { FILE_BASE_URL } from "../../../api/base";
import { Sliders, Check, Eye } from "lucide-react";
import { encryptId } from "../../../utils/functions";

const getStatus = (vehicle: Vehicle) => {
  if (!vehicle.insurance || !vehicle.pollution || !vehicle.rcDate) {
    return "Inactive";
  }

  const today = new Date();
  return (
    new Date(vehicle.insurance) >= today &&
    new Date(vehicle.pollution) >= today &&
    new Date(vehicle.rcDate) >= today
  )
    ? "Active"
    : "Inactive";
};


const statusStyles: Record<"Active" | "Inactive", string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-red-100 text-red-700",
};

const statusOptions: ("Active" | "Inactive")[] = ["Active", "Inactive"];

export default function VehicleList() {
  const navigate = useNavigate(); // ✅ initialize navigation
  const { vehicles, fetchVehicles, loading, error } = useVehicleStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<
    ("Active" | "Inactive")[]
  >([]);
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (status: "Active" | "Inactive") => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredVehicles = vehicles.filter((v) => {
    const status = getStatus(v);

    const matchesSearch =
      (v.vehicleNumber ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(status);

    return matchesSearch && matchesStatus;
  });


  if (loading) return <p className="p-6">Loading vehicles...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Vehicles</h1>

        {/* ✅ Navigation Added */}
        <button
          onClick={() => navigate("/add-vehicle")}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
        >
          + Add Vehicle
        </button>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 items-center">
        <input
          type="text"
          placeholder="Search vehicle number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-orange-500 flex-1"
        />

        {/* Filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <Sliders className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700">Filter</span>
          </button>

          {showFilter && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10 p-3 space-y-2">
              {statusOptions.map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="hidden"
                  />
                  <span className="w-5 h-5 flex items-center justify-center border rounded-sm bg-gray-50">
                    {selectedStatuses.includes(status) && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </span>
                  <span className="text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VEHICLE CARDS */}
      <div className="space-y-5 mt-6">
        {filteredVehicles.map((v) => {
          const status = getStatus(v);

          return (
            <div
              key={v.id}
              className="flex flex-col md:flex-row gap-5 bg-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
            >
              <img
                src={
                  v.vehicleImage
                    ? `${FILE_BASE_URL}${v.vehicleImage}`
                    : "https://via.placeholder.com/300x200?text=No+Image"
                }
                alt={v.vehicleName}
                className="w-full md:w-64 h-40 object-cover rounded-xl shadow-md"
              />

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-800">
                    {v.vehicleName}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm">
                  Vehicle Number:{" "}
                  <span className="font-medium">{v.vehicleNumber}</span>
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700 mt-3">
                  <Info label="Insurance" value={v.insurance?.slice(0, 10) || "N/A"} />
                  <Info label="Pollution" value={v.pollution?.slice(0, 10) || "N/A"} />
                  <Info label="RC Date" value={v.rcDate?.slice(0, 10) || "N/A"} />
                  <Info label="Kilometer" value={v.kilometer ? `${v.kilometer} km` : "N/A"} />

                </div>

              </div>
              <div className="flex items-center">
                <button
                  onClick={() => navigate(`/view-vehicle/${encryptId  (v.id)}`)}
                  className="border-2 border-orange-500 text-orange-500 px-2 py-1 rounded-lg hover:bg-orange-100 font-semibold flex gap-2"
                >
                  <Eye /> View Vehicle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);
