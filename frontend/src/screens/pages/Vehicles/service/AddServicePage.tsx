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

const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block";
const inputClass =
  "w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold " +
  "focus:bg-white focus:ring-0 focus:border-orange-500 transition-all outline-none text-slate-700";

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
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            ADD <span className="text-orange-600 uppercase">Service</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Maintenance Entry</p>
        </div>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VEHICLE & SHOP SELECTION */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}><Truck size={12} className="inline mr-1" /> Vehicle</label>
              <select name="vehicleId" value={form.vehicleId} onChange={handleChange} className={inputClass}>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.vehicleName})</option>
                ))}
              </select>
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
            disabled={isSubmitting}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <Save size={18} />
                Save Service Record
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}