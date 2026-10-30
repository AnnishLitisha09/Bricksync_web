import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicleStore } from "../../../../store/vechicle/useVehicleStore";
import { useBunkStore } from "../../../../store/useBunkStore";
import {
  ArrowLeft,
  Droplets,
  Truck,
  MapPin,
  IndianRupee,
  Calendar,
  Navigation2,
  Save,
  Loader2
} from "lucide-react";
import { useFuelStore } from "../../../../store/fuel/useFuelStore";
import SearchableVehicleSelect from "../../../../components/SearchableVehicleSelect";

const labelClass = "text-[11px] font-semibold text-slate-500 block mb-1";
const inputClass =
  "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 " +
  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none";

export default function AddFuelPage() {
  const navigate = useNavigate();
  const { createFuel, loading } = useFuelStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { bunks, fetchBunks, loading: bunksLoading } = useBunkStore();

  const [form, setForm] = useState({
    vehicleId: "",
    bunkId: "",
    volume: "",
    amount: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    kilometer: "",
  });

  const [errorMsg, setErrorMsg] = useState("");

  // Get today's date in YYYY-MM-DD format for the 'max' attribute
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    fetchVehicles();
    fetchBunks();
  }, [fetchVehicles, fetchBunks]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Positive number filtering for specific fields
    if (["volume", "amount", "kilometer"].includes(name)) {
      const filteredValue = value.replace(/[^0-9.]/g, "");
      // Prevent multiple decimals
      const parts = filteredValue.split(".");
      if (parts.length > 2) return;

      setForm({ ...form, [name]: filteredValue });
    } else {
      setForm({ ...form, [name]: value });
    }
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find(
      (v) => v.id === Number(form.vehicleId)
    );

    if (!form.vehicleId || !form.bunkId || !form.volume || !form.amount || !form.date || !form.kilometer) {
      alert("Please fill all fields");
      return;
    }

    const volumeNum = parseFloat(form.volume);
    const amountNum = parseFloat(form.amount);
    const kilometerNum = parseFloat(form.kilometer);

    if (volumeNum <= 0) {
      setErrorMsg("Volume must be a positive number");
      return;
    }

    if (amountNum <= 0) {
      setErrorMsg("Amount must be a positive number");
      return;
    }

    if (selectedVehicle && kilometerNum <= selectedVehicle.kilometer) {
      setErrorMsg(`Reading must be > ${selectedVehicle.kilometer} km`);
      return;
    }

    await createFuel({
      vehicleId: Number(form.vehicleId),
      bunkId: Number(form.bunkId),
      volume: volumeNum,
      amount: amountNum,
      date: form.date,
      kilometer: kilometerNum,
    });

    navigate("/vehicles/fuel");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              Fleet Expense
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Add <span className="text-indigo-600">Fuel Log</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Record bunk fueling, volume, total expense & odometer reading</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: ENTITY DETAILS */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Truck size={12} className="inline mr-1" /> Vehicle Number
              </label>
              <SearchableVehicleSelect
                vehicles={vehicles}
                value={form.vehicleId}
                onChange={(id) => setForm({ ...form, vehicleId: id })}
                placeholder="Search Vehicle by Number..."
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <MapPin size={12} className="inline mr-1" /> Fuel Bunk
              </label>
              <select
                name="bunkId"
                value={form.bunkId}
                onChange={handleChange}
                className={`${inputClass} ${bunksLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={bunksLoading}
              >
                <option value="">Select Bunk</option>
                {bunks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bunkName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: VOLUME & COST */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Droplets size={12} className="inline mr-1" /> Volume (Ltrs)
              </label>
              <input
                type="number"
                name="volume"
                step="0.01"
                value={form.volume}
                onChange={handleChange}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <IndianRupee size={12} className="inline mr-1" /> Total Bill Amount
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: DATE & LOGS */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Calendar size={12} className="inline mr-1" /> Filling Date
              </label>
              <input
                type="date"
                name="date"
                max={today} // FUTURE DATA DISABLED HERE
                value={form.date}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Navigation2 size={12} className="inline mr-1" /> Odometer Reading (KM)
              </label>
              <input
                type="number"
                name="kilometer"
                value={form.kilometer}
                onChange={handleChange}
                placeholder="Current KM"
                className={`${inputClass} ${errorMsg ? "border-red-200 bg-red-50 focus:border-red-500" : ""}`}
              />
              {errorMsg && (
                <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-2">
                  {errorMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-11 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors uppercase tracking-wider text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={16} />
                <span>Save Fuel Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}