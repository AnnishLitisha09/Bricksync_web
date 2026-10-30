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
    Phone,
    FileText,
    Receipt,
    Sparkles,
    Hash
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../../../../../api/base";
import type { Supplier } from "../../../../../../store/useMaterialStore";

interface MerchantModalProps {
    isOpen: boolean;
    onClose: () => void;
    shop: Supplier | null;
    onSuccess: () => void;
}

const safeJsonParse = (str: any) => {
    if (!str) return [];
    try {
        return typeof str === "string" ? JSON.parse(str) : str;
    } catch (e) {
        console.error("JSON Parse Error:", e, "on string:", str);
        return [];
    }
};

const SUGGESTED_TAGS = ["Cement", "Sand", "Bricks", "Steel", "Aggregate", "Wholesale", "Priority Vendor", "Cash Only"];

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
        gst_number: "",
        notes: "",
    });

    const [tagList, setTagList] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [customFields, setCustomFields] = useState<any[]>([]);
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);

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
                    gst_number: shop.gst_number || "",
                    notes: shop.notes || "",
                });

                // Parse tags
                if (shop.tags) {
                    const parsed = shop.tags
                        .split(",")
                        .map(t => t.trim())
                        .filter(Boolean);
                    setTagList(parsed);
                } else {
                    setTagList([]);
                }

                fetchDetails();
            } else {
                setForm({
                    shop_name: "",
                    owner_name: "",
                    phone_no: "",
                    address: "",
                    category: "Retail",
                    balance: "0",
                    gst_number: "",
                    notes: "",
                });
                setTagList([]);
                setTagInput("");
                setCustomFields([]);
                setShowAdvancedFields(false);
            }
        }
    }, [isOpen, shop]);

    const fetchDetails = async () => {
        if (!shop?.id) return;
        try {
            const response = await fetch(`${BASE_URL}/materials/suppliers/${shop.id}`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const result = await response.json();
            if (result.success && result.data) {
                const s = result.data;
                setForm(prev => ({
                    ...prev,
                    shop_name: s.shop_name || prev.shop_name,
                    owner_name: s.owner_name || prev.owner_name,
                    phone_no: s.phone_no || prev.phone_no,
                    address: s.address || prev.address,
                    category: s.category || prev.category,
                    balance: s.balance?.toString() || prev.balance,
                    gst_number: s.gst_number || prev.gst_number,
                    notes: s.notes || prev.notes,
                }));

                if (s.tags) {
                    const parsed = s.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
                    setTagList(parsed);
                }

                const fields = s.additionalFields?.map((f: any) => ({
                    id: f.id,
                    field_name: f.field_name,
                    field_options: safeJsonParse(f.field_options),
                    newOptionText: ""
                })) || [];
                setCustomFields(fields);
                if (fields.length > 0) setShowAdvancedFields(true);
            }
        } catch (err) {
            console.error("Error fetching supplier details:", err);
        }
    };

    const handleAddTag = (rawTag?: string) => {
        const value = (rawTag || tagInput).trim();
        if (!value) return;
        if (!tagList.some(t => t.toLowerCase() === value.toLowerCase())) {
            setTagList([...tagList, value]);
        }
        setTagInput("");
    };

    const handleRemoveTag = (indexToRemove: number) => {
        setTagList(tagList.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanedPhone = form.phone_no.replace(/\D/g, "");
        if (cleanedPhone.length !== 10) {
            toast.error("Phone number must be exactly 10 digits");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                shop_name: form.shop_name.trim(),
                owner_name: form.owner_name.trim(),
                phone_no: cleanedPhone,
                address: form.address.trim(),
                category: form.category,
                balance: Number(form.balance) || 0,
                gst_number: form.gst_number.trim() ? form.gst_number.trim().toUpperCase() : null,
                notes: form.notes.trim() || null,
                tags: tagList.length > 0 ? tagList.join(", ") : null,
                customFields: customFields
                    .filter(f => f.field_name?.trim())
                    .map(f => {
                        const opts = Array.isArray(f.field_options) ? [...f.field_options] : [];
                        if (f.newOptionText?.trim() && !opts.includes(f.newOptionText.trim())) {
                            opts.push(f.newOptionText.trim());
                        }
                        return {
                            field_name: f.field_name.trim(),
                            options: opts
                        };
                    })
            };

            const url = shop?.id
                ? `${BASE_URL}/materials/suppliers/${shop.id}`
                : `${BASE_URL}/materials/suppliers`;

            const response = await fetch(url, {
                method: shop?.id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                toast.success(shop ? "Merchant updated successfully!" : "Merchant registered successfully!");
                onSuccess();
                onClose();
            } else {
                toast.error(result.message || "Operation failed");
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const addField = () => {
        setCustomFields([...customFields, { id: Date.now(), field_name: "", field_options: [], newOptionText: "" }]);
        setShowAdvancedFields(true);
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
                                {shop && (
                                    <span className="text-[10px] font-bold text-slate-400">
                                        ID: #{shop.id}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                                {shop ? `Edit Vendor: ${shop.shop_name}` : "Register Material Merchant"}
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
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                        {/* Core Details Grid */}
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

                        {/* ─── ADDITIONAL INFORMATION FIELDS SECTION ─── */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-600" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                                        Additional Information Fields
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Custom tags, GST registration number & internal vendor notes
                                </p>
                            </div>

                            {/* GST Number */}
                            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Receipt size={13} className="text-indigo-600" />
                                        GST Registration Number (GSTIN)
                                    </span>
                                    <span className="text-[10px] font-normal text-slate-400">Optional</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={15}
                                        value={form.gst_number}
                                        onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                                        placeholder="e.g. 33AAAAA0000A1Z5"
                                        className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all uppercase tracking-wider"
                                    />
                                    {form.gst_number && (
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, gst_number: "" })}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Custom Tags */}
                            <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Tag size={13} className="text-indigo-600" />
                                        Custom Tags / Labels
                                    </span>
                                    <span className="text-[10px] font-normal text-slate-400">Optional</span>
                                </label>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === ",") {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                            }}
                                            placeholder="Type a tag and press Enter (e.g. Cement, VIP)..."
                                            className="w-full h-9 pl-8 pr-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAddTag()}
                                        className="h-9 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus size={14} /> Add Tag
                                    </button>
                                </div>

                                {/* Active Tags List */}
                                {tagList.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {tagList.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 shadow-2xs animate-in zoom-in-90"
                                            >
                                                <span>#{tag}</span>
                                                <X
                                                    size={12}
                                                    className="cursor-pointer hover:text-rose-600 transition-colors"
                                                    onClick={() => handleRemoveTag(idx)}
                                                />
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Suggested Quick Tags */}
                                <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-400">Suggestions:</span>
                                    {SUGGESTED_TAGS.map((stag) => {
                                        const alreadyAdded = tagList.some(t => t.toLowerCase() === stag.toLowerCase());
                                        if (alreadyAdded) return null;
                                        return (
                                            <button
                                                key={stag}
                                                type="button"
                                                onClick={() => handleAddTag(stag)}
                                                className="text-[10px] font-semibold text-slate-600 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 px-2 py-0.5 rounded-md transition-all cursor-pointer"
                                            >
                                                + {stag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Internal Notes / Terms */}
                            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <FileText size={13} className="text-indigo-600" />
                                        Vendor Notes & Terms
                                    </span>
                                    <span className="text-[10px] font-normal text-slate-400">Optional</span>
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Enter payment terms (e.g. 30 days credit), delivery instructions, or remarks..."
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* Dynamic Fields (Extra Schema Options) */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>{showAdvancedFields ? "Hide" : "Show"} Dynamic Field Presets</span>
                                        <span className="text-slate-400 text-[10px]">({customFields.length})</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={addField}
                                        className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus size={12} />
                                        <span>Add Custom Field</span>
                                    </button>
                                </div>

                                {showAdvancedFields && (
                                    <div className="space-y-3 mt-3 animate-in fade-in">
                                        {customFields.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                                No extra dynamic fields added yet. Click &quot;Add Custom Field&quot; to configure custom dropdown presets for procurement entries.
                                            </p>
                                        ) : (
                                            customFields.map((field) => (
                                                <div
                                                    key={field.id}
                                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input
                                                            placeholder="Field Title (e.g. Material Grade, Truck Size)"
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
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="Add preset option..."
                                                            className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold outline-none border border-slate-200 focus:border-indigo-600"
                                                            value={field.newOptionText || ""}
                                                            onChange={(e) =>
                                                                setCustomFields(
                                                                    customFields.map((f) =>
                                                                        f.id === field.id
                                                                            ? { ...f, newOptionText: e.target.value }
                                                                            : f
                                                                    )
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    addOption(field.id);
                                                                }
                                                            }}
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
                                                                    className="inline-flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs"
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
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. FIXED FOOTER */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                        <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">
                            {shop ? "Changes take effect immediately across all records" : "A dedicated vendor ledger will be initialized"}
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
