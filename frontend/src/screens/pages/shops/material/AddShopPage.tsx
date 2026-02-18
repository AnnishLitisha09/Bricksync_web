import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Tag,
  Plus,
  Trash2,
  ListPlus
} from "lucide-react";
import toast from "react-hot-toast";

interface CustomField {
  id: number;
  title: string;
  options: string[];
  selectedValue: string;
  newOptionText: string;
}

export default function AddShopPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    phoneNumber: "",
    address: "",
    category: "Retail",
    balance: "",
  });

  // Dynamic Fields State
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const categories = ["Retail", "Wholesale", "Distributor", "Contractor"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* 🔹 Custom Field Logic */
  const addField = () => {
    const newField: CustomField = {
      id: Date.now(),
      title: "",
      options: [],
      selectedValue: "",
      newOptionText: ""
    };
    setCustomFields([...customFields, newField]);
  };

  const removeField = (id: number) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const updateFieldTitle = (id: number, title: string) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, title } : f));
  };

  const addOptionToField = (id: number) => {
    setCustomFields(customFields.map(f => {
      if (f.id === id && f.newOptionText.trim() !== "") {
        return { 
          ...f, 
          options: [...f.options, f.newOptionText.trim()], 
          newOptionText: "" 
        };
      }
      return f;
    }));
  };

  const handleOptionInput = (id: number, text: string) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, newOptionText: text } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.ownerName || !form.phoneNumber || !form.address) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const finalData = {
        ...form,
        customFields: customFields.map(f => ({ title: f.title, value: f.selectedValue }))
      };
      console.log("Saving Shop with Custom Fields:", finalData);
      
      toast.success("Merchant registered successfully!");
      navigate("/shop/ledger");
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
        
        {/* LEFT PANEL */}
        <div className="lg:w-1/3 bg-slate-900 p-8 lg:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 space-y-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
              <Store size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
                Register <br />
                <span className="text-indigo-500 italic">New Merchant</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={addField}
              className="w-full flex items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all text-xs font-black uppercase tracking-widest"
            >
              <Plus size={18} className="text-indigo-400" />
              Add Custom Field
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
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
            </div>

            <CustomInput
              icon={<Phone size={18} />}
              label="Phone Number"
              name="phoneNumber"
              placeholder="+91 90000 00000"
              value={form.phoneNumber}
              onChange={handleChange}
            />

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
                rows={3}
                className="w-full bg-slate-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 resize-none shadow-inner"
              />
            </div>

            {/* DYNAMIC CUSTOM FIELDS SECTION */}
            <AnimatePresence>
              {customFields.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Additional Information Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {customFields.map((field) => (
                      <motion.div 
                        key={field.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <input 
                            placeholder="Field Title (e.g. GST Type)"
                            className="bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none font-black text-xs uppercase tracking-widest text-slate-700 pb-1 w-2/3"
                            value={field.title}
                            onChange={(e) => updateFieldTitle(field.id, e.target.value)}
                          />
                          <button type="button" onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Add Option Input */}
                        <div className="flex gap-2">
                          <input 
                            placeholder="Add Option..."
                            className="flex-1 bg-white rounded-xl px-4 py-2 text-xs font-bold outline-none border border-slate-200 focus:border-indigo-500"
                            value={field.newOptionText}
                            onChange={(e) => handleOptionInput(field.id, e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => addOptionToField(field.id)}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                          >
                            <ListPlus size={16} />
                          </button>
                        </div>

                        {/* Final Dropdown Preview */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase">Field Preview</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            value={field.selectedValue}
                            onChange={(e) => {
                              setCustomFields(customFields.map(f => f.id === field.id ? { ...f, selectedValue: e.target.value } : f));
                            }}
                          >
                            <option value="">Select {field.title || 'Option'}...</option>
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>

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

const CustomInput = ({ label, icon, ...props }: { label: string; icon: React.ReactNode; } & React.InputHTMLAttributes<HTMLInputElement>) => (
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