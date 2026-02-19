import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import toast from "react-hot-toast";

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
        amount: "",
        date: new Date().toISOString().split('T')[0],
    });

    const [dynamicFields, setDynamicFields] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setForm({
                    product_id: editData.product_id?.toString() || "",
                    office_id: editData.office_id?.toString() || "",
                    units: editData.units?.toString() || "",
                    amount: editData.amount?.toString() || "",
                    date: editData.date?.split('T')[0] || "",
                });
                const fieldsMap: any = {};
                editData.fields?.forEach((f: any) => {
                    fieldsMap[f.field_name] = f.field_value;
                });
                setDynamicFields(fieldsMap);
            } else if (predefinedFields) {
                setForm({
                    product_id: "",
                    office_id: "",
                    units: "",
                    amount: "",
                    date: new Date().toISOString().split('T')[0],
                });
                const initial: { [key: string]: string } = {};
                predefinedFields.forEach((f: any) => {
                    initial[f.field_name] = "";
                });
                setDynamicFields(initial);
            }
        }
    }, [isOpen, editData, predefinedFields]);

    const filteredProducts = useMemo(() => {
        if (!form.office_id) return [];
        const officeStocks = stocks.filter(s => s.office_id === Number(form.office_id));
        const stockProductIds = new Set(officeStocks.map(s => s.product_id));
        return products.filter(p => stockProductIds.has(p.product_id) || (editData && p.product_id === Number(editData.product_id)));
    }, [form.office_id, stocks, products, editData]);

    useEffect(() => {
        if (isOpen) {
            const fetchInitialData = async () => {
                try {
                    const [pRes, oRes, sRes] = await Promise.all([
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products`, {
                            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                        }),
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/offices`, {
                            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                        }),
                        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stock`, {
                            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                        })
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, supplier_id: supplierId, fields: dynamicFields };
            const url = editData
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/entries/${editData.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/entries`;

            const response = await fetch(url, {
                method: editData ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save entry");

            toast.success(editData ? "Entry updated!" : "Material entry recorded!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase italic tracking-tight">
                                {editData ? "Edit Procurement" : "New Procurement"}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Receiving Office</label>
                                <select
                                    required
                                    value={form.office_id}
                                    onChange={e => setForm({ ...form, office_id: e.target.value, product_id: "" })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Select Office...</option>
                                    {offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Material</label>
                                <select
                                    required
                                    disabled={!form.office_id}
                                    value={form.product_id}
                                    onChange={e => setForm({ ...form, product_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                                >
                                    <option value="">{form.office_id ? "Select Material..." : "Select Office First"}</option>
                                    {filteredProducts.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>

                            <div className="space-y-4">
                                {Object.entries(dynamicFields).map(([key, val]) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={key}
                                        className="space-y-2"
                                    >
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">
                                            <Tag size={12} className="text-indigo-500" />
                                            {key}
                                        </label>
                                        {(() => {
                                            const fieldDef = predefinedFields?.find((f: any) => f.field_name === key);
                                            if (fieldDef && fieldDef.field_options && Array.isArray(fieldDef.field_options) && fieldDef.field_options.length > 0) {
                                                return (
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        value={val}
                                                        onChange={e => setDynamicFields(prev => ({ ...prev, [key]: e.target.value }))}
                                                    >
                                                        <option value="">Select {key}...</option>
                                                        {fieldDef.field_options.map((opt: string, i: number) => (
                                                            <option key={i} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                );
                                            }
                                            return (
                                                <input
                                                    placeholder={`Enter ${key}...`}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={val}
                                                    onChange={e => setDynamicFields(prev => ({ ...prev, [key]: e.target.value }))}
                                                />
                                            );
                                        })()}
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Units</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        value={form.units}
                                        onChange={e => setForm({ ...form, units: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-50"
                            >
                                {loading ? "Processing..." : editData ? "Update Entry" : "Save Entry"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EntryModal;
