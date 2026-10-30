import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Calculator, PackageCheck, Building2, Calendar, DollarSign, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../../../../../api/base";

interface EntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    supplierId: number | string;
    predefinedFields?: any[];
    editData?: any;
}

const EntryModal: React.FC<EntryModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    supplierId,
    predefinedFields,
    editData
}) => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [offices, setOffices] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);

    const [form, setForm] = useState({
        product_id: "",
        office_id: "",
        units: "",
        unit_price: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
    });

    const [dynamicFields, setDynamicFields] = useState<{ [key: string]: string }>({});

    // Load initial data on open or edit
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const u = editData.units !== undefined && editData.units !== null ? editData.units.toString() : "";
                const a = editData.amount !== undefined && editData.amount !== null ? editData.amount.toString() : "";
                let p = "";

                if (editData.unit_price !== undefined && editData.unit_price !== null && Number(editData.unit_price) > 0) {
                    p = editData.unit_price.toString();
                } else if (Number(u) > 0 && Number(a) > 0) {
                    p = (Number(a) / Number(u)).toFixed(2);
                }

                setForm({
                    product_id: editData.product_id?.toString() || "",
                    office_id: editData.office_id?.toString() || "",
                    units: u,
                    unit_price: p,
                    amount: a,
                    date: editData.date?.split("T")[0] || new Date().toISOString().split("T")[0],
                });

                const fieldsMap: Record<string, string> = {};
                if (predefinedFields && Array.isArray(predefinedFields)) {
                    predefinedFields.forEach((f: any) => {
                        fieldsMap[f.field_name] = "";
                    });
                }
                if (editData.fields && Array.isArray(editData.fields)) {
                    editData.fields.forEach((f: any) => {
                        fieldsMap[f.field_name] = f.field_value || "";
                    });
                }
                setDynamicFields(fieldsMap);
            } else {
                setForm({
                    product_id: "",
                    office_id: "",
                    units: "",
                    unit_price: "",
                    amount: "",
                    date: new Date().toISOString().split("T")[0],
                });

                const initial: Record<string, string> = {};
                if (predefinedFields && Array.isArray(predefinedFields)) {
                    predefinedFields.forEach((f: any) => {
                        initial[f.field_name] = "";
                    });
                }
                setDynamicFields(initial);
            }
        }
    }, [isOpen, editData, predefinedFields]);

    // Fetch products, offices, stock
    useEffect(() => {
        if (isOpen) {
            const fetchInitialData = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const [pRes, oRes, sRes] = await Promise.all([
                        fetch(`${BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${BASE_URL}/offices`, { headers: { Authorization: `Bearer ${token}` } }),
                        fetch(`${BASE_URL}/stock`, { headers: { Authorization: `Bearer ${token}` } })
                    ]);
                    const pData = await pRes.json();
                    const oData = await oRes.json();
                    const sData = await sRes.json();
                    if (pData.success) setProducts(pData.data);
                    if (oData.success) setOffices(oData.data);
                    if (sData) setStocks(Array.isArray(sData) ? sData : (sData.data || []));
                } catch (err) {
                    console.error("Failed to fetch entry details:", err);
                }
            };
            fetchInitialData();
        }
    }, [isOpen]);

    const filteredProducts = useMemo(() => {
        if (!form.office_id) return products;
        const officeStocks = stocks.filter(s => s.office_id === Number(form.office_id));
        const stockProductIds = new Set(officeStocks.map(s => s.product_id));
        // Return products in office stock, or currently selected product, or all products if no stock filtered yet
        const matching = products.filter(
            p => stockProductIds.has(p.product_id) || (editData && p.product_id === Number(editData.product_id))
        );
        return matching.length > 0 ? matching : products;
    }, [form.office_id, stocks, products, editData]);

    // Automatic calculation: Units & Amount Per Unit -> Total Amount
    const handleUnitsChange = (val: string) => {
        const u = val;
        const p = form.unit_price;
        let calculatedAmount = form.amount;

        if (u !== "" && p !== "") {
            const numUnits = parseFloat(u) || 0;
            const numPrice = parseFloat(p) || 0;
            calculatedAmount = (numUnits * numPrice).toFixed(2);
        }

        setForm(prev => ({
            ...prev,
            units: u,
            amount: calculatedAmount
        }));
    };

    const handleUnitPriceChange = (val: string) => {
        const p = val;
        const u = form.units;
        let calculatedAmount = form.amount;

        if (u !== "" && p !== "") {
            const numUnits = parseFloat(u) || 0;
            const numPrice = parseFloat(p) || 0;
            calculatedAmount = (numUnits * numPrice).toFixed(2);
        }

        setForm(prev => ({
            ...prev,
            unit_price: p,
            amount: calculatedAmount
        }));
    };

    const handleAmountChange = (val: string) => {
        const a = val;
        const u = form.units;
        let calculatedUnitPrice = form.unit_price;

        if (a !== "" && u !== "" && parseFloat(u) > 0) {
            const numAmount = parseFloat(a) || 0;
            const numUnits = parseFloat(u) || 1;
            calculatedUnitPrice = (numAmount / numUnits).toFixed(2);
        }

        setForm(prev => ({
            ...prev,
            amount: a,
            unit_price: calculatedUnitPrice
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numUnits = parseFloat(form.units);
        const numAmount = parseFloat(form.amount);
        const numUnitPrice = parseFloat(form.unit_price) || 0;

        if (!form.office_id) {
            toast.error("Please select a receiving office");
            return;
        }

        if (!form.product_id) {
            toast.error("Please select a material product");
            return;
        }

        if (isNaN(numUnits) || numUnits <= 0) {
            toast.error("Units must be greater than 0");
            return;
        }

        if (isNaN(numAmount) || numAmount < 0) {
            toast.error("Total amount cannot be negative");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                supplier_id: supplierId,
                office_id: Number(form.office_id),
                product_id: Number(form.product_id),
                date: form.date,
                units: numUnits,
                unit_price: numUnitPrice,
                amount: numAmount,
                fields: dynamicFields,
            };

            const url = editData?.id
                ? `${BASE_URL}/materials/entries/${editData.id}`
                : `${BASE_URL}/materials/entries`;

            const response = await fetch(url, {
                method: editData?.id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || "Failed to save procurement entry");
            }

            toast.success(editData ? "Procurement entry updated!" : "Material intake recorded successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to save entry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
                    />

                    {/* Modal Window */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                                    <PackageCheck size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                        Material Intake
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                                        {editData ? "Edit Procurement Entry" : "Record Material Intake"}
                                    </h3>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                {/* Receiving Office */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Building2 size={13} className="text-indigo-600" />
                                        Receiving Office / Facility <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.office_id}
                                        onChange={(e) => setForm({ ...form, office_id: e.target.value })}
                                        className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Select Receiving Office...</option>
                                        {offices.map((o) => (
                                            <option key={o.office_id} value={o.office_id}>
                                                {o.office_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Material Product */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers size={13} className="text-indigo-600" />
                                        Material Item / Product <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={form.product_id}
                                        onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                        className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Select Material Product...</option>
                                        {filteredProducts.map((p) => (
                                            <option key={p.product_id} value={p.product_id}>
                                                {p.product_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Intake Date */}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar size={13} className="text-indigo-600" />
                                        Procurement Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                    />
                                </div>

                                {/* Units & Unit Price & Amount Calculation */}
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                            <Calculator size={13} className="text-indigo-600" />
                                            Quantity & Pricing Calculation
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-100">
                                            Auto-Calculated
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {/* Units */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Units / Qty <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                step="any"
                                                min="0.01"
                                                placeholder="e.g. 100"
                                                value={form.units}
                                                onChange={(e) => handleUnitsChange(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                            />
                                        </div>

                                        {/* Amount Per Unit */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Amount Per Unit (₹)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="e.g. 45.00"
                                                value={form.unit_price}
                                                onChange={(e) => handleUnitPriceChange(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                            />
                                        </div>

                                        {/* Total Amount */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                Total Amount (₹) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                step="any"
                                                min="0"
                                                placeholder="0.00"
                                                value={form.amount}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl font-black text-xs text-indigo-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Real-time Calculation Summary Badge */}
                                    {Number(form.units) > 0 && Number(form.unit_price) > 0 && (
                                        <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
                                            <div className="flex items-center gap-1.5">
                                                <DollarSign size={13} className="text-indigo-600" />
                                                <span>
                                                    {Number(form.units).toLocaleString()} Units × ₹
                                                    {Number(form.unit_price).toLocaleString("en-IN")}/unit
                                                </span>
                                            </div>
                                            <span className="font-black text-sm text-indigo-700">
                                                = ₹{Number(form.amount || 0).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Predefined Fields (from Merchant settings) */}
                                {Object.keys(dynamicFields).length > 0 && (
                                    <div className="space-y-3 pt-2 border-t border-slate-100">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                                            Specific Material Specifications
                                        </span>
                                        <div className="space-y-3">
                                            {Object.entries(dynamicFields).map(([key, val]) => {
                                                const fieldDef = predefinedFields?.find((f: any) => f.field_name === key);
                                                const options = fieldDef?.field_options && Array.isArray(fieldDef.field_options) ? fieldDef.field_options : [];

                                                return (
                                                    <div key={key} className="space-y-1">
                                                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                            <Tag size={12} className="text-indigo-500" />
                                                            {key}
                                                        </label>
                                                        {options.length > 0 ? (
                                                            <select
                                                                className="w-full h-10 px-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                                                                value={val}
                                                                onChange={(e) => setDynamicFields(prev => ({ ...prev, [key]: e.target.value }))}
                                                            >
                                                                <option value="">Select {key}...</option>
                                                                {options.map((opt: string, i: number) => (
                                                                    <option key={i} value={opt}>
                                                                        {opt}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                placeholder={`Enter ${key}...`}
                                                                className="w-full h-10 px-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                                                                value={val}
                                                                onChange={(e) => setDynamicFields(prev => ({ ...prev, [key]: e.target.value }))}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                                <p className="text-[11px] font-semibold text-slate-400 hidden sm:block">
                                    Inventory stock & vendor balance will adjust automatically
                                </p>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={loading}
                                        className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? "Processing..." : editData ? "Update Entry" : "Record Intake"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EntryModal;
