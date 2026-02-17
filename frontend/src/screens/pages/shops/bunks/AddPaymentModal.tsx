import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, Landmark, Smartphone, CreditCard, Wallet, StickyNote, Loader2, CheckCircle2 } from "lucide-react";
import { useMemo, useEffect, useState } from "react";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  banks: any[];
  bunkName: string;
}

export default function AddPaymentModal({ isOpen, onClose, onSubmit, banks, bunkName }: AddPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    bankId: "",
    payment_mode: "",
    description: ""
  });

  const selectedBankData = useMemo(() => 
    banks.find(b => b.id.toString() === form.bankId), 
  [form.bankId, banks]);

  const availableModes = useMemo(() => {
    if (!selectedBankData) return [];
    if (selectedBankData.name.toLowerCase() === 'cash') return ["CASH"];
    
    const modes = [];
    if (selectedBankData.gpay) modes.push("GPAY");
    if (selectedBankData.phonepe) modes.push("PHONEPE");
    if (selectedBankData.bankTransfer) modes.push("BANK TRANSFER");
    return modes;
  }, [selectedBankData]);

  useEffect(() => {
    if (availableModes.length > 0) {
      setForm(prev => ({ ...prev, payment_mode: availableModes[0] }));
    } else {
      setForm(prev => ({ ...prev, payment_mode: "" }));
    }
  }, [availableModes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setForm({ amount: "", bankId: "", payment_mode: "", description: "" });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Add Payment</h2>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Record Settlement</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>

            <form className="p-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Receiving Station</label>
                <div className="relative">
                  <input disabled value={bunkName} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800" />
                  <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Source Bank Account</label>
                <div className="relative">
                  <select required value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none appearance-none transition-all">
                    <option value="">Select a Bank...</option>
                    {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>)}
                  </select>
                  <Landmark className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Mode</label>
                  <div className="relative">
                    <select 
                        disabled={!form.bankId || availableModes.length === 0} 
                        required 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 appearance-none outline-none"
                        value={form.payment_mode}
                        onChange={(e) => setForm({...form, payment_mode: e.target.value})}
                    >
                      {availableModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                    {form.payment_mode === "CASH" ? <Wallet className="absolute right-5 top-1/2 -translate-y-1/2 text-orange-500" size={18} /> : <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount</label>
                  <div className="relative">
                    <input type="number" required placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none" />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-emerald-600">₹</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 outline-none resize-none" placeholder="Transaction details..." />
              </div>

              <button type="submit" disabled={isSubmitting || !form.bankId} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}