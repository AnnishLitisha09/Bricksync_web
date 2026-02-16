import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFuelStore } from "../../../../store/useFuelStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";
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

const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block";
const inputClass = 
  "w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold " +
  "focus:bg-white focus:ring-0 focus:border-orange-500 transition-all outline-none text-slate-700";

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
    setForm({ ...form, [e.target.name]: e.target.value });
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

    if (selectedVehicle && Number(form.kilometer) <= selectedVehicle.kilometer) {
      setErrorMsg(`Reading must be > ${selectedVehicle.kilometer} km`);
      return;
    }

    await createFuel({
      vehicleId: Number(form.vehicleId),
      bunkId: Number(form.bunkId),
      volume: Number(form.volume),
      amount: Number(form.amount),
      date: form.date,
      kilometer: Number(form.kilometer),
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
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            ADD <span className="text-orange-600">FUEL LOG</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">New Consumption Entry</p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: ENTITY DETAILS */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Truck size={12} className="inline mr-1" /> Vehicle Number
              </label>
              <select
                name="vehicleId"
                value={form.vehicleId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} (Last: {v.kilometer} km)
                  </option>
                ))}
              </select>
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-2xl font-black text-slate-400 bg-white border border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <Save size={18} />
                Save Fuel Record
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}