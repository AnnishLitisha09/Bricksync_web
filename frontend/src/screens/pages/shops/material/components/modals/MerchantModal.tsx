import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
import { BASE_URL } from "../../../../../../api/base";

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
            const response = await fetch(`${BASE_URL}/materials/suppliers/${shop.id}`, {
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

        if (form.phone_no.length !== 10) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

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

            const url = shop?.id
                ? `${BASE_URL}/materials/suppliers/${shop.id}`
                : `${BASE_URL}/materials/suppliers`;

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

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop Blur */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 1. FIXED HEADER */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                            <Store size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    Material Supplier
                                </span>
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                                {shop ? "Update Material Merchant" : "Register Material Merchant"}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Close Modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 2. SCROLLABLE FORM BODY */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {/* Two Column Basic Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Shop Name */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Store size={13} className="text-indigo-600" />
                                    Shop / Business Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={form.shop_name}
                                    onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                                    placeholder="e.g. Global Build-Mart"
                                    className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                />
                            </div>

                            {/* Owner Name */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={13} className="text-indigo-600" />
                                    Owner / Contact Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.owner_name}
                                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                                    placeholder="e.g. Michael Scott"
                                    className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag size={13} className="text-indigo-600" />
                                    Business Category
                                </label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
                                >
                                    {["Retail", "Wholesale", "Distributor", "Contractor"].map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Balance */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard size={13} className="text-indigo-600" />
                                    {shop ? "Current Balance (₹)" : "Initial Balance (₹)"}
                                </label>
                                <input
                                    type="number"
                                    value={form.balance}
                                    readOnly={!!shop}
                                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                                    placeholder="0.00"
                                    className={`w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all ${
                                        shop ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Phone size={13} className="text-indigo-600" />
                                Phone Number (10 digits) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                maxLength={10}
                                value={form.phone_no}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    if (val.length <= 10) setForm({ ...form, phone_no: val });
                                }}
                                placeholder="e.g. 9876543210"
                                className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                            />
                        </div>

                        {/* Full Address */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={13} className="text-indigo-600" />
                                Full Business Address <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={2}
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="Enter street, landmark, city, and pincode..."
                                className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Custom Metadata Fields Section */}
                        <div className="pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                                        Additional Information Fields
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        Optional custom tags, GST numbers, or notes
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="h-8 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus size={14} />
                                    <span>Add Field</span>
                                </button>
                            </div>

                            {customFields.length > 0 && (
                                <div className="space-y-3">
                                    {customFields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <input
                                                    placeholder="Field Title (e.g. GST Number, Credit Days)"
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                                                    value={field.field_name}
                                                    onChange={(e) =>
                                                        setCustomFields(
                                                            customFields.map((f) =>
                                                                f.id === field.id ? { ...f, field_name: e.target.value } : f
                                                            )
                                                        )
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeField(field.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove Field"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="Add preset option..."
                                                    className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold outline-none border border-slate-200 focus:border-indigo-600"
                                                    value={field.newOptionText}
                                                    onChange={(e) =>
                                                        setCustomFields(
                                                            customFields.map((f) =>
                                                                f.id === field.id
                                                                    ? { ...f, newOptionText: e.target.value }
                                                                    : f
                                                            )
                                                        )
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => addOption(field.id)}
                                                    className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                                                >
                                                    Add
                                                </button>
                                            </div>

                                            {field.field_options && field.field_options.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {field.field_options.map((opt: string, i: number) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs"
                                                        >
                                                            <span>{opt}</span>
                                                            <X
                                                                size={11}
                                                                className="cursor-pointer hover:text-rose-600 transition-colors"
                                                                onClick={() => removeOption(field.id, i)}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. FIXED FOOTER */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                        <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">
                            {shop ? "Updates reflect instantly in merchant statements" : "New vendor ledger created upon registration"}
                        </p>

                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={15} />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} />
                                        <span>{shop ? "Save Changes" : "Complete Registration"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default MerchantModal;
