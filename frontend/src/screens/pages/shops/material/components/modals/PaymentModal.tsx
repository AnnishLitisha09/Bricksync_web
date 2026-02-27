import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "../../../../../../api/base";

interface Bank {
    id: number;
    name: string;
    amount: string | number;
    gpay?: boolean;
    phonepe?: boolean;
    bankTransfer?: boolean;
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    supplierId: number | string;
    editData?: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    supplierId,
    editData
}) => {
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [form, setForm] = useState({
        amount: "",
        bank_id: "",
        payment_mode: "Bank Transfer",
        description: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchBanks();
            if (editData) {
                setForm({
                    amount: editData.amount?.toString() || "",
                    bank_id: editData.bank_id?.toString() || "",
                    payment_mode: editData.payment_mode || "Bank Transfer",
                    description: editData.description || "",
                });
            } else {
                setForm({
                    amount: "",
                    bank_id: "",
                    payment_mode: "Bank Transfer",
                    description: "",
                });
            }
        }
    }, [isOpen, editData]);

    const selectedBankData = React.useMemo(() =>
        banks.find(b => b.id.toString() === form.bank_id),
        [form.bank_id, banks]
    );

    const availableModes = React.useMemo(() => {
        if (!selectedBankData) return [];
        if (selectedBankData.name.toLowerCase() === 'cash') return ["CASH"];
        const modes = [];
        if (selectedBankData.gpay) modes.push("GPAY");
        if (selectedBankData.phonepe) modes.push("PHONEPE");
        if (selectedBankData.bankTransfer) modes.push("BANK TRANSFER");

        // Fallback if none are true but it's not cash
        if (modes.length === 0) return ["BANK TRANSFER", "CHEQUE", "UPI"];

        return modes;
    }, [selectedBankData]);

    React.useEffect(() => {
        if (availableModes.length > 0) {
            // Automatically switch if the current payment mode is invalid for this bank
            const currentModeUpper = form.payment_mode.toUpperCase();
            if (!availableModes.includes(currentModeUpper)) {
                setForm(prev => ({ ...prev, payment_mode: availableModes[0] }));
            }
        } else if (form.bank_id === "") {
            setForm(prev => ({ ...prev, payment_mode: "BANK TRANSFER" }));
        }
    }, [availableModes]);

    const fetchBanks = async () => {
        try {
            const response = await fetch(`${BASE_URL}/banks`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const result = await response.json();
            if (result.success) setBanks(result.data);
        } catch (err) {
            console.error("Failed to fetch banks:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, supplier_id: supplierId };
            const url = editData
                ? `${BASE_URL}/materials/statements/${editData.id}`
                : `${BASE_URL}/materials/statements`;

            const response = await fetch(url, {
                method: editData ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save payment");

            toast.success(editData ? "Payment updated!" : "Payment recorded successfully!");
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
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-emerald-600">
                                {editData ? "Update Payment" : "Record Payment"}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Paid Amount (₹)</label>
                                <input
                                    required
                                    type="number"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Source Bank Account</label>
                                <select
                                    required
                                    value={form.bank_id}
                                    onChange={e => setForm({ ...form, bank_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none"
                                >
                                    <option value="">Select Account...</option>
                                    {banks.map(b => <option key={b.id} value={b.id}>{b.name} (₹{Number(b.amount).toLocaleString()})</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Mode</label>
                                <select
                                    required
                                    disabled={!form.bank_id || availableModes.length === 0}
                                    value={form.payment_mode}
                                    onChange={e => setForm({ ...form, payment_mode: e.target.value })}
                                    className={`w-full border rounded-xl p-3 text-xs font-bold outline-none ${(!form.bank_id || availableModes.length === 0) ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-slate-50 border-slate-100'}`}
                                >
                                    {!form.bank_id && <option value="">Select Bank First</option>}
                                    {availableModes.map(mode => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reference / Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Invoice # / Txn ID..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none h-24 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !form.bank_id || !form.payment_mode}
                                className="w-full mt-4 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50"
                            >
                                {loading ? "Processing..." : editData ? "Update Payment" : "Confirm Payment"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
