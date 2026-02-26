import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Store,
    X,
    Trash2,
    Plus,
    Save,
    Loader2,
    User,
    Tag,
    CreditCard,
    MapPin,
    Phone
} from "lucide-react";
import toast from "react-hot-toast";

interface ShopEntry {
    id: number;
    shop_name: string;
    owner_name: string;
    phone_no: string;
    address: string;
    category: string;
    balance: string | number;
    createdAt: string;
}

interface MerchantModalProps {
    isOpen: boolean;
    onClose: () => void;
    shop: ShopEntry | null;
    onSuccess: () => void;
}

const safeJsonParse = (str: any) => {
    if (!str) return [];
    try {
        return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (e) {
        console.error("JSON Parse Error:", e, "on string:", str);
        return [];
    }
};

const CustomInput = ({ label, icon, className, ...props }: { label: string; icon: React.ReactNode; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <span className="text-indigo-500">{icon}</span>
            {label}
        </label>
        <input
            {...props}
            className={`w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 shadow-inner placeholder:text-slate-300 ${className || ""}`}
        />
    </div>
);

const MerchantModal: React.FC<MerchantModalProps> = ({
    isOpen,
    onClose,
    shop,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        shop_name: "",
        owner_name: "",
        phone_no: "",
        address: "",
        category: "Retail",
        balance: "",
    });
    const [customFields, setCustomFields] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (shop) {
                setForm({
                    shop_name: shop.shop_name || "",
                    owner_name: shop.owner_name || "",
                    phone_no: shop.phone_no || "",
                    address: shop.address || "",
                    category: shop.category || "Retail",
                    balance: shop.balance?.toString() || "0",
                });
                fetchDetails();
            } else {
                setForm({
                    shop_name: "",
                    owner_name: "",
                    phone_no: "",
                    address: "",
                    category: "Retail",
                    balance: "0",
                });
                setCustomFields([]);
            }
        }
    }, [isOpen, shop]);

    const fetchDetails = async () => {
        if (!shop) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers/${shop.id}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const result = await response.json();
            if (result.success) {
                const fields = result.data.additionalFields?.map((f: any) => ({
                    id: f.id,
                    field_name: f.field_name,
                    field_options: safeJsonParse(f.field_options),
                    newOptionText: ""
                })) || [];
                setCustomFields(fields);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                balance: Number(form.balance) || 0,
                customFields: customFields.map(f => ({
                    field_name: f.field_name,
                    options: f.field_options
                }))
            };

            if (form.phone_no.length !== 10) {
                toast.error("Phone number must be exactly 10 digits");
                setLoading(false);
                return;
            }

            const url = shop?.id
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers/${shop.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers`;

            const response = await fetch(url, {
                method: shop ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                toast.success(shop ? "Merchant updated" : "Merchant registered");
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Operation failed");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const addField = () => {
        setCustomFields([...customFields, { id: Date.now(), field_name: "", field_options: [], newOptionText: "" }]);
    };

    const removeField = (id: number) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    const addOption = (id: number) => {
        setCustomFields(customFields.map(f => {
            if (f.id === id && f.newOptionText.trim()) {
                const currentOptions = Array.isArray(f.field_options) ? f.field_options : [];
                return { ...f, field_options: [...currentOptions, f.newOptionText.trim()], newOptionText: "" };
            }
            return f;
        }));
    };

    const removeOption = (fieldId: number, optionIdx: number) => {
        setCustomFields(customFields.map(f => {
            if (f.id === fieldId) {
                return { ...f, field_options: f.field_options.filter((_: any, idx: number) => idx !== optionIdx) };
            }
            return f;
        }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col lg:flex-row"
                    >
                        {/* LEFT SIDEBAR - Registration Theme */}
                        <div className="lg:w-1/3 bg-slate-900 p-8 lg:p-12 text-white relative overflow-hidden flex flex-col justify-between shrink-0">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
                                    <Store size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
                                        {shop ? "Update" : "Register"} <br />
                                        <span className="text-indigo-500 italic">Merchant</span>
                                    </h1>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">
                                        {shop ? "Modify existing supplier records" : "Add new business partners to your material supply chain"}
                                    </p>
                                </div>

                                <div className="space-y-4 pt-10">
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">1</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Basic Details</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">2</div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Custom Metadata</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 pt-10">
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="w-full flex items-center justify-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest group"
                                >
                                    <Plus size={18} className="text-indigo-400 group-hover:rotate-90 transition-transform" />
                                    Add Custom Field
                                </button>
                            </div>
                        </div>

                        {/* RIGHT FORM - Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-12">
                            <div className="flex justify-between items-center mb-8 lg:hidden">
                                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{shop ? "Edit" : "New"} Merchant</h2>
                                <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <CustomInput
                                        icon={<Store size={18} />}
                                        label="Shop Name"
                                        value={form.shop_name}
                                        onChange={e => setForm({ ...form, shop_name: e.target.value })}
                                        placeholder="Global Build-Mart"
                                        required
                                    />
                                    <CustomInput
                                        icon={<User size={18} />}
                                        label="Owner Name"
                                        value={form.owner_name}
                                        onChange={e => setForm({ ...form, owner_name: e.target.value })}
                                        placeholder="Michael Scott"
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Tag size={12} className="text-indigo-500" />
                                            Business Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 shadow-inner appearance-none"
                                            >
                                                {["Retail", "Wholesale", "Distributor", "Contractor"].map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <CustomInput
                                        icon={<CreditCard size={18} />}
                                        label={shop ? "Current Balance (₹)" : "Initial Balance (₹)"}
                                        type="number"
                                        value={form.balance}
                                        onChange={e => setForm({ ...form, balance: e.target.value })}
                                        placeholder="0.00"
                                        readOnly={!!shop}
                                        className={shop ? "bg-slate-100 opacity-60" : ""}
                                    />
                                </div>

                                <CustomInput
                                    icon={<Phone size={18} />}
                                    label="Phone Number"
                                    value={form.phone_no}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (val.length <= 10) setForm({ ...form, phone_no: val });
                                    }}
                                    placeholder="+91 90000 00000"
                                    required
                                />

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <MapPin size={12} className="text-indigo-500" />
                                        Full Address
                                    </label>
                                    <textarea
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="Enter complete business location details..."
                                        rows={3}
                                        required
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-4xl px-6 py-5 text-sm font-bold focus:bg-white focus:border-indigo-500 transition-all outline-none text-slate-700 resize-none shadow-inner"
                                    />
                                </div>

                                {/* CUSTOM FIELDS */}
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
                                                        className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4 shadow-sm"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <input
                                                                placeholder="Field Title (e.g. GST TYPE)"
                                                                className="bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 outline-none font-black text-[10px] uppercase tracking-widest text-slate-700 pb-1 w-2/3"
                                                                value={field.field_name}
                                                                onChange={(e) => setCustomFields(customFields.map(f => f.id === field.id ? { ...f, field_name: e.target.value } : f))}
                                                            />
                                                            <button type="button" onClick={() => removeField(field.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            <input
                                                                placeholder="Add Option..."
                                                                className="flex-1 bg-white rounded-xl px-4 py-2 text-[10px] font-bold outline-none border border-slate-200 focus:border-indigo-500 shadow-sm"
                                                                value={field.newOptionText}
                                                                onChange={(e) => setCustomFields(customFields.map(f => f.id === field.id ? { ...f, newOptionText: e.target.value } : f))}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => addOption(field.id)}
                                                                className="px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-[10px] font-black uppercase"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                                                            {field.field_options.map((opt: string, i: number) => (
                                                                <span key={i} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-slate-200 text-[9px] font-bold text-slate-500 shadow-sm">
                                                                    {opt}
                                                                    <X size={10} className="cursor-pointer hover:text-red-500" onClick={() => removeOption(field.id, i)} />
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </AnimatePresence>

                                {/* FORM ACTIONS */}
                                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-dashed border-slate-100">
                                    <button
                                        type="button"
                                        onClick={onClose}
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
                                                {shop ? "Save Changes" : "Complete Registration"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* EXIT BUTTON FOR DESKTOP */}
                        <button
                            onClick={onClose}
                            className="absolute top-8 right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all z-20 hidden lg:block"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MerchantModal;
