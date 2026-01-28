import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Plus, Wrench } from "lucide-react";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";

type AmountFilter = "ALL" | "10000" | "20000" | "50000";

export default function ServiceShopPage() {
  const navigate = useNavigate();
  const { shops, loading, error, fetchShops } = useServiceShopStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("ALL");

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = shops.filter((s) => {
    const matchSearch =
      s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchTerm.toLowerCase());

    let matchAmount = true;
    if (amountFilter === "10000") matchAmount = s.amount >= 10000;
    if (amountFilter === "20000") matchAmount = s.amount >= 20000;
    if (amountFilter === "50000") matchAmount = s.amount >= 50000;

    return matchSearch && matchAmount;
  });

  if (loading) {
    return <p className="p-6">Loading service shops...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Service Shops</h1>

        <button
          onClick={() => navigate("/shop/services/add")}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Shop
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-3 items-center relative">
        <input
          type="text"
          placeholder="Search shop or owner..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg px-4 py-2 border focus:ring-2 focus:ring-orange-500"
        />

        <button
          onClick={() => setShowFilter(!showFilter)}
          className="p-2 rounded-lg border hover:bg-gray-100"
        >
          <Filter size={18} />
        </button>

        {showFilter && (
          <div className="absolute right-0 top-12 bg-white border shadow-xl rounded-xl w-52 z-10">
            <p className="px-4 py-2 text-sm font-semibold border-b">
              Filter by Amount
            </p>

            {[
              { label: "All", value: "ALL" },
              { label: "Above ₹10,000", value: "10000" },
              { label: "Above ₹20,000", value: "20000" },
              { label: "Above ₹50,000", value: "50000" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setAmountFilter(f.value as AmountFilter);
                  setShowFilter(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 ${
                  amountFilter === f.value
                    ? "bg-orange-100 text-orange-600 font-semibold"
                    : ""
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {filteredShops.map((s) => (
          <div
            key={s.id}
            className="flex flex-col md:flex-row gap-5 bg-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="w-full md:w-40 h-32 flex items-center justify-center bg-white rounded-xl border">
              <Wrench size={40} className="text-orange-500" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {s.shop_name}
                </h2>

                <span className="px-4 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  ₹ {s.amount.toLocaleString()}
                </span>
              </div>

              <p className="text-gray-600 text-sm">
                Owner: <span className="font-medium">{s.owner}</span>
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 mt-3">
                <Info label="Phone" value={s.phone} />
                <Info label="Address" value={s.address} />
                <Info label="Type" value={s.type} />
              </div>
            </div>
          </div>
        ))}

        {filteredShops.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            No service shops found
          </p>
        )}
      </div>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);
