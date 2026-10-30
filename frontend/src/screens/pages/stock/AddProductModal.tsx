import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { FILE_BASE_URL } from "../../../api/base";

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

const labelClass = "text-[11px] font-semibold text-slate-500 block mb-1";
const inputClass =
    "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 " +
    "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none disabled:opacity-50";

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
                await updateProduct(editData.product_id, formData);

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

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
                {/* Backdrop Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10"
                >
                    {/* 1. FIXED HEADER */}
                    <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                                <Package size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                    {editData ? "Edit" : "Add"} <span className="text-indigo-600">Product</span>
                                </h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Inventory Management</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* 2. FORM & SCROLLABLE BODY */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className={labelClass}><Package size={12} className="inline mr-1" /> Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Solid Brick 4-inch"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <div>
                                    {!imagePreview ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all"
                                        >
                                            <div className="p-2.5 bg-white rounded-xl shadow-2xs text-slate-400 group-hover:text-indigo-600 group-hover:scale-105 transition-all border border-slate-200/80">
                                                <Upload size={18} />
                                            </div>
                                            <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Click to upload photo</p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-36 rounded-2xl overflow-hidden group border border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <img
                                                src={imagePreview?.startsWith('data:') || imagePreview?.startsWith('http') ? imagePreview : `${FILE_BASE_URL}${imagePreview}`}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-3 py-1.5 bg-white text-slate-700 rounded-xl shadow-md hover:bg-slate-100 transition-all text-xs font-bold cursor-pointer"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="p-2 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all cursor-pointer"
                                                    title="Remove"
                                                >
                                                    <X size={16} />
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
                                    rows={2}
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Detailed description..."
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* 3. FIXED FOOTER */}
                        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        <span>{editData ? "Update Product" : "Create Product"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
