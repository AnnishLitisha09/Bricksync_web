import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Landmark, Calendar, CreditCard, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchBanks } from "../../../api/bank";
import { createStatement, updateStatement } from "../../../api/statement";

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string | number;
    editData?: any;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, customerId, editData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amount: "",
        bank_type: "Bank Transfer",
        bank_id: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            const loadBanks = async () => {
                try {
                    const res = await fetchBanks();
                    setBanks(res.data);
                } catch (error) {
                    toast.error("Failed to load banks");
                }
            };
            loadBanks();

            if (editData) {
                setFormData({
                    amount: editData.amount?.toString() || "",
                    bank_type: editData.bank_type || "Bank Transfer",
                    bank_id: editData.bank_id?.toString() || "",
                    description: editData.description || "",
                    date: editData.date || editData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
                });
            } else {
                setFormData({
                    amount: "",
                    bank_type: "Bank Transfer",
                    bank_id: "",
                    description: "",
                    date: new Date().toISOString().split('T')[0]
                });
            }
        }
    }, [isOpen, editData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount) return toast.error("Please enter amount");

        setIsSubmitting(true);
        try {
            const payload = {
                cus_id: Number(customerId),
                amount: Number(formData.amount),
                bank_type: formData.bank_type,
                bank_id: formData.bank_id ? Number(formData.bank_id) : null,
                description: formData.description,
                date: formData.date
            };

            if (editData) {
                await updateStatement(editData.id, payload);
                toast.success("Payment record updated");
            } else {
                await createStatement(payload);
                toast.success("Payment recorded successfully");
            }
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={(e) => { e.stopPropagation(); onClose(); }} />
            <div className="bg-white rounded-4xl w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                {/* Modal Content */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                            {editData ? "Edit Payment" : "Record Payment"}
                        </h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Customer Settlement</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 ml-1">Amount (₹)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-emerald-50 bg-emerald-50/30 font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/5 focus:bg-white outline-none"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Mode</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none appearance-none"
                                value={formData.bank_type}
                                onChange={(e) => setFormData({ ...formData, bank_type: e.target.value })}
                            >
                                <option>Bank Transfer</option>
                                <option>PhonePe</option>
                                <option>GPay</option>
                                <option>Cash</option>
                            </select>
                        </div>

                        {formData.bank_type !== 'Cash' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Receive in Bank</label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                                    <select
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none appearance-none"
                                        value={formData.bank_id}
                                        onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
                                        required={formData.bank_type !== 'Cash'}
                                    >
                                        <option value="">Select Bank Account</option>
                                        {banks.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} - {b.accountNumber}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description / Notes</label>
                        <textarea
                            placeholder="Add reference or note..."
                            rows={3}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <CreditCard size={18} />
                        )}
                        {editData ? "Update Payment Record" : "Confirm & Save Payment"}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RecordPaymentModal;
