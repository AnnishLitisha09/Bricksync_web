import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Landmark, Calendar, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchBanks } from "../../../api/bank";
import { createStatement, updateStatement } from "../../../api/statement";

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string | number;
    editData?: any;
    initialAmount?: string | number;
    initialDate?: string;
    onPaymentSubmit?: (paymentPayload: {
        cus_id: number;
        amount: number;
        bank_type: string;
        bank_id: number | null;
        description: string;
        date: string;
    }) => Promise<void>;
    title?: string;
    subtitle?: string;
    submitButtonText?: string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
    isOpen,
    onClose,
    customerId,
    editData,
    initialAmount,
    initialDate,
    onPaymentSubmit,
    title,
    subtitle,
    submitButtonText,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [banks, setBanks] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        amount: "",
        bank_type: "Net Banking",
        bank_id: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            const loadBanks = async () => {
                try {
                    const res = await fetchBanks();
                    const bankList = res.data || [];
                    setBanks(bankList);

                    if (!editData && bankList.length > 0) {
                        const defaultBank = bankList.find((b: any) => b.name.toLowerCase() === 'cash') || bankList[0];
                        let defaultType = "Net Banking";
                        if (defaultBank.name.toLowerCase() === 'cash') defaultType = "Cash";
                        else if (defaultBank.bankTransfer) defaultType = "Net Banking";
                        else if (defaultBank.gpay) defaultType = "GPay";
                        else if (defaultBank.phonepe) defaultType = "PhonePe";

                        setFormData(prev => ({
                            ...prev,
                            bank_id: prev.bank_id || defaultBank.id.toString(),
                            bank_type: prev.bank_type || defaultType
                        }));
                    }
                } catch (error) {
                    toast.error("Failed to load banks");
                }
            };
            loadBanks();

            if (editData) {
                const selectedBank = banks.find(b => b.id === editData.bank_id);
                setFormData({
                    amount: editData.amount?.toString() || "",
                    bank_type: editData.bank_type || (selectedBank?.name.toLowerCase() === 'cash' ? "Cash" : "Net Banking"),
                    bank_id: editData.bank_id?.toString() || "",
                    description: editData.description || "",
                    date: editData.date || editData.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    amount: initialAmount !== undefined && initialAmount !== null ? String(initialAmount) : "",
                    description: "",
                    date: initialDate || new Date().toISOString().split('T')[0]
                }));
            }
        }
    }, [isOpen, editData, initialAmount, initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || Number(formData.amount) <= 0) {
            return toast.error("Please enter a valid amount");
        }

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

            if (onPaymentSubmit) {
                await onPaymentSubmit(payload);
            } else if (editData) {
                await updateStatement(editData.id, payload);
                toast.success("Payment record updated");
                onClose();
            } else {
                await createStatement(payload);
                toast.success("Payment recorded successfully");
                onClose();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to record payment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); onClose(); }} />
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/80">
                {/* Modal Content */}
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {title || (editData ? "Edit Payment" : "Record Payment")}
                        </h3>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">
                            {subtitle || "Customer Settlement & Ledger Balancing"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500 block">Payment Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-emerald-700 block">Amount (₹)</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={15} />
                                <input
                                    type="number"
                                    required
                                    autoFocus
                                    placeholder="0.00"
                                    className="w-full pl-9 pr-3 h-10 rounded-xl border border-emerald-200 bg-emerald-50/20 font-bold text-xs text-emerald-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500 block">Receive in Account / Cash</label>
                            <div className="relative">
                                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                                <select
                                    required
                                    className="w-full pl-9 pr-3 h-10 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none appearance-none"
                                    value={formData.bank_id}
                                    onChange={(e) => {
                                        const newBankId = e.target.value;
                                        const selectedBank = banks.find(b => b.id === Number(newBankId));
                                        let newBankType = "";

                                        if (selectedBank) {
                                            if (selectedBank.name.toLowerCase() === 'cash') {
                                                newBankType = "Cash";
                                            } else if (selectedBank.bankTransfer) {
                                                newBankType = "Net Banking";
                                            } else if (selectedBank.gpay) {
                                                newBankType = "GPay";
                                            } else if (selectedBank.phonepe) {
                                                newBankType = "PhonePe";
                                            }
                                        }

                                        setFormData(prev => ({
                                            ...prev,
                                            bank_id: newBankId,
                                            bank_type: newBankType
                                        }));
                                    }}
                                >
                                    <option value="">Select Account...</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} - {b.accountNumber}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500 block">Payment Mode</label>
                            <select
                                className="w-full px-3.5 h-10 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none appearance-none"
                                value={formData.bank_type}
                                onChange={(e) => setFormData({ ...formData, bank_type: e.target.value })}
                            >
                                {(() => {
                                    const selectedBank = banks.find(b => b.id === Number(formData.bank_id));
                                    if (!selectedBank) return <option value="">Select Account First</option>;
                                    if (selectedBank.name.toLowerCase() === 'cash') return <option value="Cash">Cash</option>;
                                    return (
                                        <>
                                            {selectedBank.bankTransfer && <option value="Net Banking">Net Banking</option>}
                                            {selectedBank.gpay && <option value="GPay">GPay</option>}
                                            {selectedBank.phonepe && <option value="PhonePe">PhonePe</option>}
                                        </>
                                    );
                                })()}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-500 block">Description / Notes</label>
                        <textarea
                            placeholder="Add reference, cheque number or notes..."
                            rows={2}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs disabled:opacity-50 mt-2 cursor-pointer"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                <span>{submitButtonText || (editData ? "Update Settlement" : "Confirm Settlement")}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RecordPaymentModal;
