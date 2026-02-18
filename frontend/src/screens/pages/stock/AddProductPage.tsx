import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Store, 
  Upload, 
  FileText,
  Boxes,
  Save,
  Loader2,
  X
} from "lucide-react";

const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block";
const inputClass = 
  "w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold " +
  "focus:bg-white focus:ring-0 focus:border-orange-500 transition-all outline-none text-slate-700";

export default function AddProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    shopId: "",
    qty: "",
    description: "",
    imageFile: null as File | null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, imageFile: null });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!form.name || !form.shopId || !form.qty) {
      alert("Please fill in Name, Shop, and Quantity");
      setLoading(false);
      return;
    }

    try {
      // Here you would typically use FormData for file uploads
      // const formData = new FormData();
      // formData.append('file', form.imageFile);
      
      console.log("Submitting Data:", form);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate("/inventory");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-4 md:p-8"
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
          <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center uppercase">
            Add <span className="text-orange-600">Product</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Inventory Management</p>
        </div>
        <div className="w-10" /> 
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: IDENTITY & STORE */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Package size={12} className="inline mr-1" /> Product Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Wireless Mouse"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Store size={12} className="inline mr-1" /> Select Shop
              </label>
              <select
                name="shopId"
                value={form.shopId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Choose Store</option>
                <option value="shop1">Shop 1 (Main Branch)</option>
                <option value="shop2">Shop 2 (Service Center)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: CATEGORY & STOCK */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>
                <Tag size={12} className="inline mr-1" /> Category
              </label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Electronics"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Boxes size={12} className="inline mr-1" /> Opening Quantity
              </label>
              <input
                type="number"
                name="qty"
                value={form.qty}
                onChange={handleChange}
                placeholder="0"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: IMAGE UPLOAD */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <label className={labelClass}>
            <Upload size={12} className="inline mr-1" /> Product Image
          </label>
          
          <div className="mt-2">
            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group w-full aspect-video md:aspect-[21/9] bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-orange-600 group-hover:scale-110 transition-all">
                  <Upload size={24} />
                </div>
                <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-tighter">Click to upload photo</p>
                <p className="text-[10px] text-slate-300 font-bold">JPG, PNG or WEBP (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </div>

        {/* SECTION 4: DESCRIPTION */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="space-y-1">
            <label className={labelClass}>
              <FileText size={12} className="inline mr-1" /> Product Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the product..."
              className={`${inputClass} resize-none`}
            />
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
                Create Product
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}