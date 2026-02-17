import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Store, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Save, 
  Loader2,
  ShieldCheck,
  Info,
  Tag
} from "lucide-react";
import toast from "react-hot-toast";

// Assuming you have a shop store similar to your bunk store
// import { useShopStore } from "../../../../store/useShopStore";

export default function AddShopPage() {
  const navigate = useNavigate();
  
  // Replace with your actual store hook
  // const { createShop, loading } = useShopStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phoneNumber: "",
    address: "",
    category: "Retail",
    balance: "",
  });

  const categories = ["Retail", "Wholesale", "Distributor", "Contractor"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.shopName || !form.ownerName || !form.phoneNumber || !form.address) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      // Logic to save shop
      console.log("Saving Shop:", form);
      
      // await createShop({
      //   ...form,
      //   balance: Number(form.balance) || 0,
      // });

      toast.success("Merchant registered successfully!");
      navigate("/shop/ledger"); // Navigate back to your shop list
    } catch (error) {
      toast.error("Failed to register shop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-4 md:p-8 font-sans"
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="group mb-6 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black uppercase tracking-widest text-[10px]"
      >
        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-50">
          <ArrowLeft size={16} />
        </div>
        Back to Ledger
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100 flex flex-col lg:flex-row">
        
        {/* LEFT PANEL: INFO & DECORATION */}
        <div className="lg:w-1/3 bg-slate-900 p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
              <Store size={32} />
            </div>
            
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-tight">
                REGISTER <br />
                <span className="text-indigo-500 italic">NEW MERCHANT</span>
              </h1>
              <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed">
                Onboard a new vendor to your ledger system to manage credit, track outstanding balances, and streamline procurement.
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <ShieldCheck size={16} className="text-emerald-500" />
                Verified Merchant Entry
              </div>
              <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                <Tag size={16} className="text-indigo-500" />
                Category Based Tracking
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hidden lg:block">
            <div className="flex gap-3">
               <Info className="text-indigo-500 shrink-0" size={18} />
               <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                 Initial balance setup will create a starting point for the credit history. This can be adjusted later through transactions.
               </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORM */}
        <div className="flex-1 p-8 lg:p-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <CustomInput
                icon={<Store size={18} />}
                label="Shop Name"
                name="shopName"
                placeholder="Global Build-Mart"
                value={form.shopName}
                onChange={handleChange}
              />

              <CustomInput
                icon={<User size={18} />}
                label="Owner Name"
                name="ownerName"
                placeholder="Michael Scott"
                value={form.ownerName}
                onChange={handleChange}
              />

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Tag size={12} className="text-indigo-500" />
                  Business Category
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 shadow-inner appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <CustomInput
                icon={<CreditCard size={18} />}
                label="Initial Balance (₹)"
                name="balance"
                type="number"
                placeholder="0.00"
                value={form.balance}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <CustomInput
                  icon={<Phone size={18} />}
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="+91 90000 00000"
                  value={form.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-indigo-500" />
                Full Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter complete business location details..."
                rows={4}
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 resize-none shadow-inner"
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
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                    Complete Registration
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
      <span className="text-indigo-500">{icon}</span>
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 shadow-inner placeholder:text-slate-300"
    />
  </div>
);