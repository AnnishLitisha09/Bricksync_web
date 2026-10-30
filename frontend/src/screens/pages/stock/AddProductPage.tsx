import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { getAllOffices, createProduct } from "../../../api/inventory";

interface Office {
  office_id: number;
  office_name: string;
}


const labelClass = "text-[11px] font-semibold text-slate-500 ml-0.5 mb-1.5 block";
const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-3.5 h-10 text-xs font-medium " +
  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none text-slate-800";

import toast from "react-hot-toast";

export default function AddProductPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    shopId: "",
    qty: "",
    description: "",
    imageFile: null as File | null,
  });

  useState(() => {
    getAllOffices().then(setOffices).catch(console.error);
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
      const formData = new FormData();
      formData.append("product_name", form.name);
      formData.append("category", form.category);
      formData.append("office_id", form.shopId);
      formData.append("quantity", form.qty);
      formData.append("description", form.description);
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      await createProduct(formData);
      toast.success("Product created successfully!");
      navigate("/stock");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product. Please try again.");
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
              Inventory Item
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Add <span className="text-indigo-600">Product</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Register a new manufactured item or raw material into your yard catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1: IDENTITY & STORE */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelClass}>
                <Package size={12} className="inline mr-1 text-slate-400" /> Product Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Red Solid Bricks"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Store size={12} className="inline mr-1 text-slate-400" /> Select Shop
              </label>
              <select
                name="shopId"
                value={form.shopId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Choose Store</option>
                {offices.map(o => (
                  <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: CATEGORY & STOCK */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelClass}>
                <Tag size={12} className="inline mr-1 text-slate-400" /> Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Category</option>
                <option value="bricks">Bricks</option>
                <option value="sand">Sand</option>
                <option value="cement">Cement</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>
                <Boxes size={12} className="inline mr-1 text-slate-400" /> Opening Quantity
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
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-slate-200/80">
          <label className={labelClass}>
            <Upload size={12} className="inline mr-1 text-slate-400" /> Product Image
          </label>

          <div className="mt-2">
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group w-full aspect-video md:aspect-21/9 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-all"
              >
                <div className="p-3 bg-white rounded-xl shadow-2xs text-slate-400 group-hover:text-indigo-600 transition-all">
                  <Upload size={20} />
                </div>
                <p className="mt-2 text-xs font-bold text-slate-600">Click to upload photo</p>
                <p className="text-[10px] text-slate-400 font-medium">JPG, PNG or WEBP (Max 5MB)</p>
              </div>
            ) : (
              <div className="relative w-full aspect-video md:aspect-21/9 rounded-xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-all"
                  >
                    <X size={18} />
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
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-2xs border border-slate-200/80">
          <div className="space-y-1">
            <label className={labelClass}>
              <FileText size={12} className="inline mr-1 text-slate-400" /> Product Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the product..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none text-slate-800 resize-none"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-10 px-6 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-xs"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="h-10 px-8 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-2xs hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Save size={16} />
                <span>Create Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}