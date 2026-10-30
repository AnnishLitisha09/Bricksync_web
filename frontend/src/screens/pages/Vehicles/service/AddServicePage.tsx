import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicleStore } from "../../../../store/vechicle/useVehicleStore";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import {
  ArrowLeft,
  Wrench,
  Truck,
  Store,
  FileText,
  IndianRupee,
  Calendar,
  Navigation2,
  Save,
  Loader2,
  Info
} from "lucide-react";
import SearchableVehicleSelect from "../../../../components/SearchableVehicleSelect";

const labelClass = "text-[11px] font-semibold text-slate-500 block mb-1";
const inputClass =
  "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 " +
  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none";

export default function AddServicePage() {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { shops, fetchShops, loading: shopsLoading } = useServiceShopStore();

  const [form, setForm] = useState({
    vehicleId: "",
    serviceShopId: "",
    topic: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
    kilometer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    fetchVehicles();
    fetchShops();
  }, [fetchVehicles, fetchShops]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Positive number filtering for selective fields
    if (["amount", "kilometer"].includes(name)) {
      const filteredValue = value.replace(/[^0-9.]/g, "");
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

    if (!form.vehicleId || !form.topic || !form.date || !form.amount || !form.kilometer) {
      alert("Please fill all required fields");
      return;
    }

    const kilometerNum = Number(form.kilometer);
    const amountNum = Number(form.amount);
    const selectedVehicle = vehicles.find(v => v.id === Number(form.vehicleId));

    if (amountNum <= 0) {
      setErrorMsg("Cost must be a positive number");
      return;
    }

    if (selectedVehicle && kilometerNum <= selectedVehicle.kilometer) {
      setErrorMsg(`Reading must be > ${selectedVehicle.kilometer} km`);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...form,
      vehicleId: Number(form.vehicleId),
      serviceShopId: form.serviceShopId ? Number(form.serviceShopId) : null,
      amount: amountNum,
      kilometer: kilometerNum,
      serviceId: Math.floor(Math.random() * 1000000), // Internal logic as per your snippet
    };

    try {
      const res = await fetch(`${BASE_URL}/vehicle-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to add service");
        return;
      }
      navigate("/vehicles/services");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-4"
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
              Fleet Maintenance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Add <span className="text-indigo-600">Service Log</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Record vehicle workshop repair, oil service or maintenance entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VEHICLE & SHOP SELECTION */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}><Truck size={12} className="inline mr-1" /> Vehicle</label>
              <SearchableVehicleSelect
                vehicles={vehicles}
                value={form.vehicleId}
                onChange={(id) => setForm({ ...form, vehicleId: id })}
                placeholder="Search Vehicle by Number..."
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}><Store size={12} className="inline mr-1" /> Service Shop</label>
              <select name="serviceShopId" value={form.serviceShopId} onChange={handleChange} className={inputClass} disabled={shopsLoading}>
                <option value="">Select Shop (Optional)</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.shop_name} — {s.owner}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SERVICE DETAILS */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-1">
            <label className={labelClass}><Wrench size={12} className="inline mr-1" /> Service Topic</label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="e.g. Engine Oil Change"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}><FileText size={12} className="inline mr-1" /> Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Detailed notes on work done..."
              className={`${inputClass} min-h-[100px] resize-none py-4`}
            />
          </div>
        </div>

        {/* LOGISTICS & COST */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className={labelClass}><Calendar size={12} className="inline mr-1" /> Date</label>
              <input type="date" name="date" max={today} value={form.date} onChange={handleChange} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}><IndianRupee size={12} className="inline mr-1" /> Cost</label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}><Navigation2 size={12} className="inline mr-1" /> Odometer</label>
              <input
                type="number"
                name="kilometer"
                value={form.kilometer}
                onChange={handleChange}
                placeholder="KM"
                className={`${inputClass} ${errorMsg ? "border-red-200 bg-red-50 focus:border-red-500" : ""}`}
              />
            </div>
          </div>
          {errorMsg && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase mt-4 flex items-center gap-1 ml-2">
              <Info size={12} /> {errorMsg}
            </motion.p>
          )}
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
            disabled={isSubmitting}
            className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <Save size={16} />
                <span>Save Service Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}