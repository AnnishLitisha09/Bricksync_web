import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Fuel, 
  User, 
  Phone, 
  MapPin, 
  Wallet, 
  ArrowLeft, 
  Save, 
  Loader2,
  ShieldCheck,
  Info
} from "lucide-react";
import { useBunkStore } from "../../../../store/useBunkStore";

export default function AddBunkPage() {
  const navigate = useNavigate();
  const { createBunk, loading } = useBunkStore();

  const [form, setForm] = useState({
    bunkName: "",
    ownerName: "",
    phoneNumber: "",
    address: "",
    amount: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.bunkName || !form.ownerName || !form.phoneNumber || !form.address || !form.amount) {
      alert("Please fill all fields");
      return;
    }

    await createBunk({
      ...form,
      amount: Number(form.amount),
    });

    navigate("/shop/bunks");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-4 md:p-8"
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors font-black uppercase tracking-widest text-[10px]"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-orange-50">
          <ArrowLeft size={16} />
        </div>
        Back to Network
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col lg:flex-row">
        
        {/* LEFT PANEL: INFO & DECORATION */}
        <div className="lg:w-1/3 bg-slate-900 p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-900/50">
              <Fuel size={32} />
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                REGISTER <br />
                <span className="text-orange-500 italic">NEW BUNK</span>
              </h1>
              <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed">
                Add a new fuel station to your partner network to begin managing credit limits and tracking fuel expenses.
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <ShieldCheck size={16} className="text-emerald-500" />
                Verified Vendor Entry
              </div>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <Wallet size={16} className="text-orange-500" />
                Auto-Credit Sync
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hidden lg:block">
            <div className="flex gap-3">
               <Info className="text-orange-500 shrink-0" size={18} />
               <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                 Ensure the phone number is accurate as it will be used for official payment communication and billing.
               </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORM */}
        <div className="flex-1 p-8 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CustomInput
                icon={<Fuel size={18} />}
                label="Bunk Name"
                name="bunkName"
                placeholder="Indian Oil - South Wing"
                value={form.bunkName}
                onChange={handleChange}
              />

              <CustomInput
                icon={<User size={18} />}
                label="Owner Name"
                name="ownerName"
                placeholder="John Doe"
                value={form.ownerName}
                onChange={handleChange}
              />

              <CustomInput
                icon={<Phone size={18} />}
                label="Phone Number"
                name="phoneNumber"
                placeholder="+91 98765 43210"
                value={form.phoneNumber}
                onChange={handleChange}
              />

              <CustomInput
                icon={<Wallet size={18} />}
                label="Initial Credit Amount (₹)"
                name="amount"
                type="number"
                placeholder="50,000"
                value={form.amount}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-orange-500" />
                Station Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter full street address, city, and pincode..."
                rows={4}
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-orange-500 transition-all outline-none text-slate-700 resize-none shadow-inner"
              />
            </div>

            {/* ACTION BUTTONS */}
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
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                    Save Bunk Profile
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
      <span className="text-orange-500">{icon}</span>
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-orange-500 transition-all outline-none text-slate-700 shadow-inner placeholder:text-slate-300"
    />
  </div>
);