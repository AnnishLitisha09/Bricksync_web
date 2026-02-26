import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  User,
  Phone,
  MapPin,
  Wallet,
  ArrowLeft,
  Save,
  Loader2,
  ShieldCheck,
  Settings,
  ChevronDown
} from "lucide-react";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";
import toast from "react-hot-toast";

export default function AddServiceShopPage() {
  const navigate = useNavigate();
  const { createServiceShop, loading } = useServiceShopStore();

  const [form, setForm] = useState({
    shop_name: "",
    owner: "",
    phone: "",
    address: "",
    amount: "",
    type: "showroom",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const val = value.replace(/\D/g, "");
      if (val.length <= 10) {
        setForm({ ...form, [name]: val });
      }
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.shop_name || !form.owner || !form.phone || !form.address || !form.amount || !form.type) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    await createServiceShop({
      shop_name: form.shop_name,
      owner: form.owner,
      phone: form.phone,
      address: form.address,
      amount: Number(form.amount),
      type: form.type as any,
    });

    navigate("/shop/services");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-4 md:p-8"
    >
      {/* BACK NAVIGATION */}
      <button
        onClick={() => navigate(-1)}
        className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors font-black uppercase tracking-widest text-[10px]"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-emerald-50">
          <ArrowLeft size={16} />
        </div>
        Back to Hubs
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col lg:flex-row">

        {/* LEFT PANEL: BRANDING */}
        <div className="lg:w-1/3 bg-slate-900 p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/50">
              <Wrench size={32} />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
                Add <br />
                <span className="text-emerald-500 italic">Service Hub</span>
              </h1>
              <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed">
                Onboard new workshop partners, specialized showrooms, or maintenance providers to your service network.
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <ShieldCheck size={16} className="text-emerald-500" />
                Partner Verification
              </div>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <Settings size={16} className="text-emerald-500" />
                Service Tracking Enabled
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORM */}
        <div className="flex-1 p-8 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CustomInput
                icon={<Wrench size={18} />}
                label="Shop Name"
                name="shop_name"
                placeholder="Elite Motors Workshop"
                value={form.shop_name}
                onChange={handleChange}
              />

              <CustomInput
                icon={<User size={18} />}
                label="Owner Name"
                name="owner"
                placeholder="Michael Scott"
                value={form.owner}
                onChange={handleChange}
              />

              <CustomInput
                icon={<Phone size={18} />}
                label="Phone Number"
                name="phone"
                placeholder="+91 90000 12345"
                value={form.phone}
                onChange={handleChange}
              />

              <CustomInput
                icon={<Wallet size={18} />}
                label="Opening Balance (₹)"
                name="amount"
                type="number"
                placeholder="25,000"
                value={form.amount}
                onChange={handleChange}
              />

              {/* SERVICE TYPE SELECT */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Settings size={12} className="text-emerald-500" />
                  Service Type
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full appearance-none bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none text-slate-700 shadow-inner"
                  >
                    <option value="showroom">Showroom</option>
                    <option value="paint">Paint</option>
                    <option value="tyre">Tyre</option>
                    <option value="others">Others</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* ADDRESS TEXTAREA */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-emerald-500" />
                Shop Location
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter the full commercial address..."
                rows={4}
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none text-slate-700 resize-none shadow-inner"
              />
            </div>

            {/* ACTION FOOTER */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-dashed border-slate-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                    Register Workshop
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

/* 🔹 Custom Styled Input Component */
const CustomInput = ({
  label,
  icon,
  ...props
}: {
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
      <span className="text-emerald-500">{icon}</span>
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-emerald-500 transition-all outline-none text-slate-700 shadow-inner placeholder:text-slate-300"
    />
  </div>
);