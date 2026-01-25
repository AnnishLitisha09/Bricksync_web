import React, { useEffect, useState } from "react";
import { Mail, Search, Plus } from "lucide-react";
import Template from "../../../components/Template";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { useDriverStore, type DriverType } from "../../../store/driverStore";
import { useNavigate } from "react-router-dom";

type AmountFilter =
  | "All"
  | "Below 5000"
  | "Below 10000"
  | "Below 15000"
  | "Below 20000"
  | "Below 25000"
  | "Below 30000";

const Staff: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AmountFilter>("All");

  const drivers = useDriverStore((state) => state.drivers);
  const setDrivers = useDriverStore((state) => state.setDrivers);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/user/drivers`, {
        headers: getAuthHeader(),
      });

      const data: DriverType[] = await res.json();

      const updatedData = data.map((d) => ({
        ...d,
        status: "Active" as "Active",
      }));

      setDrivers(updatedData);
    } catch (error) {
      console.log("Error fetching drivers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const applyFilter = (driver: DriverType) => {
    const amount = Number(driver.amount);

    if (filter === "All") return true;
    if (filter === "Below 5000") return amount < 5000;
    if (filter === "Below 10000") return amount < 10000;
    if (filter === "Below 15000") return amount < 15000;
    if (filter === "Below 20000") return amount < 20000;
    if (filter === "Below 25000") return amount < 25000;
    if (filter === "Below 30000") return amount < 30000;

    return true;
  };

  const filteredDrivers = drivers.filter((d) => {
    const query = search.toLowerCase();

    const matchesSearch =
      d.name.toLowerCase().includes(query) ||
      d.email.toLowerCase().includes(query) ||
      d.phoneNumber.toLowerCase().includes(query);

    return matchesSearch && applyFilter(d);
  });

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="flex items-center justify-between md:hidden">
        <h2 className="text-lg font-semibold text-gray-900">
          Driver Management
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border hover:bg-gray-100">
            <Search size={18} />
          </button>
          <button
            onClick={() => navigate("/driver/add")}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-black text-white text-sm"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search drivers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Desktop Template */}
      <div className="hidden md:block">
        <Template
          title="Driver Management"
          subtitle="Manage drivers and their details"
          totalCount={filteredDrivers.length}
          searchPlaceholder="Search drivers"
          filters={[
            "All",
            "Below 5000",
            "Below 10000",
            "Below 15000",
            "Below 20000",
            "Below 25000",
            "Below 30000",
          ]}
          selectedFilter={filter}
          onSearchChange={(val) => setSearch(val)}
          onFilterSelect={(val) => setFilter(val as AmountFilter)}
          buttonText="Add Driver"
          onButtonClick={() => navigate("/driver/add")}
        />
      </div>

      {/* Amount Filters (Mobile) */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {[
          "All",
          "Below 5000",
          "Below 10000",
          "Below 15000",
          "Below 20000",
          "Below 25000",
          "Below 30000",
        ].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as AmountFilter)}
            className={`px-4 py-2 rounded-full text-sm border ${
              filter === f
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 hidden md:table-header-group shadow-md">
            <tr>
              <th className="text-left p-4">Driver</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Status</th>
              <th className="p-4"></th>
            </tr>
          </thead>

          <tbody>
            {filteredDrivers.map((d, index) => (
              <tr key={index} className="even:bg-gray-100 hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {d.imageUrl ? (
                      <img
                        src={`${FILE_BASE_URL}${d.imageUrl}`}
                        alt={d.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center rotate-12">
                        <span className="text-red-600 font-semibold -rotate-12">
                          {d.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.email}</p>
                    </div>
                  </div>
                </td>

                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {d.phoneNumber}
                </td>

                <td className="p-4 text-gray-600 hidden md:table-cell">
                  {d.email}
                </td>

                <td className="p-4 text-gray-600 hidden md:table-cell">
                  ₹ {d.amount}
                </td>

                <td className="p-4 hidden md:table-cell">
                  <span className="text-white bg-green-500 px-3 py-1 rounded-full text-xs">
                    {d.status ?? "Active"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="hidden md:flex items-center gap-2">
                    <button className="p-2 rounded-lg border hover:bg-gray-100">
                      <Mail size={16} />
                    </button>
                  </div>

                  <div className="md:hidden flex justify-end">
                    <button className="p-2 rounded-lg border hover:bg-gray-100">
                      <Mail size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredDrivers.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No drivers found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {loading && (
          <div className="p-4 text-center text-gray-500">
            Loading drivers...
          </div>
        )}
      </div>
    </div>
  );
};

export default Staff;
