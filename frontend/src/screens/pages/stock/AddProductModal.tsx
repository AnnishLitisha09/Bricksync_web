import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
import { getAllOffices, createProduct, updateProduct, updateStock } from "../../../api/inventory";
import toast from "react-hot-toast";

interface Office {
    office_id: number;
    office_name: string;
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any; // If provided, we are in edit mode
}

const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block";
const inputClass =
    "w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold " +
    "focus:bg-white focus:ring-0 focus:border-orange-500 transition-all outline-none text-slate-700 disabled:opacity-50";

export default function AddProductModal({ isOpen, onClose, onSuccess, editData }: AddProductModalProps) {
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

    useEffect(() => {
        if (isOpen) {
            getAllOffices()
                .then(data => setOffices(data.success ? data.data : (Array.isArray(data) ? data : [])))
                .catch(console.error);

            if (editData) {
                // Pre-fill for edit mode
                setForm({
                    name: editData.product?.product_name || "",
                    category: editData.product?.category || "",
                    shopId: editData.office_id?.toString() || "",
                    qty: editData.quantity?.toString() || "",
                    description: editData.product?.description || "",
                    imageFile: null,
                });
                setImagePreview(editData.product?.image_url || null);
            } else {
                // Reset for add mode
                setForm({
                    name: "",
                    category: "",
                    shopId: "",
                    qty: "",
                    description: "",
                    imageFile: null,
                });
                setImagePreview(null);
            }
        }
    }, [isOpen, editData]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name === "qty") {
            const filteredValue = value.replace(/[^0-9.]/g, "");
            const parts = filteredValue.split(".");
            if (parts.length > 2) return;
            setForm({ ...form, [name]: filteredValue });
        } else {
            setForm({ ...form, [name]: value });
        }
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

        if (!form.name || (!editData && (!form.shopId || !form.qty))) {
            toast.error("Please fill in Name, Shop, and Quantity");
            setLoading(false);
            return;
        }

        if (parseFloat(form.qty) <= 0) {
            toast.error("Quantity must be a positive number");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("product_name", form.name);
            formData.append("category", form.category);
            formData.append("description", form.description);

            if (!editData) {
                formData.append("office_id", form.shopId);
                formData.append("quantity", form.qty);
            }

            if (form.imageFile) {
                formData.append("image", form.imageFile);
            }

            if (editData) {
                // We are updating the Product record, not the stock record directly here
                // The backend updateProduct expects product_id
                await updateProduct(editData.product_id, formData);

                // Also update stock quantity if it changed
                if (parseFloat(form.qty) !== parseFloat(editData.quantity)) {
                    await updateStock(editData.stock_id, parseFloat(form.qty));
                }

                toast.success("Product updated successfully!");
            } else {
                await createProduct(formData);
                toast.success("Product created successfully!");
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(editData ? "Failed to update product." : "Failed to create product.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden my-auto"
                    >
                        <div className="p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-2">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                                    <Package size={24} />
                                </div>
                                <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="text-left">
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                    {editData ? "Edit" : "Add"} <span className="text-orange-600">Product</span>
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Inventory Management</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className={labelClass}><Package size={12} className="inline mr-1" /> Product Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Wireless Mouse"
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className={labelClass}><Store size={12} className="inline mr-1" /> Select Shop</label>
                                        <select
                                            name="shopId"
                                            value={form.shopId}
                                            onChange={handleChange}
                                            className={inputClass}
                                            disabled={!!editData}
                                            required={!editData}
                                        >
                                            <option value="">{editData ? "Fixed Location" : "Choose Store"}</option>
                                            {offices.map(o => (
                                                <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className={labelClass}><Tag size={12} className="inline mr-1" /> Category</label>
                                        <select
                                            name="category"
                                            value={form.category}
                                            onChange={handleChange}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="bricks">Bricks</option>
                                            <option value="sand">Sand</option>
                                            <option value="cement">Cement</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className={labelClass}><Boxes size={12} className="inline mr-1" /> {editData ? "Current Stock (Adjustable)" : "Opening Quantity"}</label>
                                        <input
                                            type="number"
                                            name="qty"
                                            value={form.qty}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className={labelClass}><Upload size={12} className="inline mr-1" /> Product Image</label>
                                    <div className="mt-2">
                                        {!imagePreview ? (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="group w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-4xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all"
                                            >
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-orange-600 group-hover:scale-110 transition-all">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="mt-3 text-xs font-black text-slate-400 uppercase tracking-tighter">Click to upload photo</p>
                                            </div>
                                        ) : (
                                            <div className="relative w-full aspect-video rounded-4xl overflow-hidden group">
                                                <img
                                                    src={imagePreview?.startsWith('data:') || imagePreview?.startsWith('http') ? imagePreview : `http://localhost:3002${imagePreview}`}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={removeImage}
                                                        className="p-3 bg-red-500 text-white rounded-2xl shadow-xl hover:bg-red-600 transition-all"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className={labelClass}><FileText size={12} className="inline mr-1" /> Product Description</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Detailed description..."
                                        className={`${inputClass} resize-none`}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {editData ? "Update Product" : "Create Product"}</>}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
