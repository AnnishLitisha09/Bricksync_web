import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useBankStore } from "../../../../store/bankStore";
import { BASE_URL_NO_API, getAuthHeader } from "../../../../api/base";
import { deobfuscate } from "../../../../utils/encryption";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  refresh: () => void;
}

const LedgerModal: React.FC<Props> = ({ isOpen, onClose, userId, refresh }) => {
  const { banks, fetchBanks } = useBankStore();
  const [modalLoading, setModalLoading] = useState(false);
  const [mode, setMode] = useState<"salary" | "advance">("salary");

  const [formData, setFormData] = useState({
    amount: "",
    type: "received" as "received" | "sent",
    description: "Monthly Salary",
    date: new Date().toISOString().split("T")[0],
    bankId: "",
    paymentType: "",
  });

  const realUserId = useMemo(() => deobfuscate(userId), [userId]);

  const selectedBankData = useMemo(() => banks.find((b) => b.id.toString() === formData.bankId), [formData.bankId, banks]);

  const availableModes = useMemo(() => {
    if (!selectedBankData) return [];
    if (selectedBankData.name.toLowerCase() === "cash") return ["CASH"];
    const modes = [];
    if (selectedBankData.gpay) modes.push("GPAY");
    if (selectedBankData.phonepe) modes.push("PHONEPE");
    if (selectedBankData.bankTransfer) modes.push("BANK TRANSFER");
    return modes;
  }, [selectedBankData]);

  useEffect(() => {
    if (availableModes.length > 0) setFormData((prev) => ({ ...prev, paymentType: availableModes[0] }));
  }, [availableModes]);

  useEffect(() => {
    if (isOpen) {
      fetchBanks();
    }
  }, [isOpen, fetchBanks]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankId) return toast.error("Please select a bank");
    setModalLoading(true);

    try {
      const payload = {
        userid: Number(realUserId),
        bankName: selectedBankData?.name || "Cash",
        amount: Number(formData.amount),
        type: mode === "salary" ? "sent" : (formData.type === "received" ? "sent" : "received"), // Business gives (sent) or recovers (received)
        category: mode,
        paymentType: formData.paymentType,
        description: formData.description,
        date: formData.date,
      };

      const res = await fetch(`${BASE_URL_NO_API}/api/wallet/transaction`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(mode === "salary" ? "Salary payment recorded" : "Advance transaction recorded");
        onClose();
        setFormData(prev => ({ ...prev, type: 'received', amount: '', description: mode === 'salary' ? 'Monthly Salary' : 'Fuel Advance' }));
        refresh();
      } else {
        throw new Error(result.message || "Server rejected transaction");
      }
    } catch (err: any) {
      console.error("Ledger error:", err);
      toast.error(err.message || "Transaction failed. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manage Funds</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Staff Ledger Entry</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"><X size={16} /></button>
            </div>
            <form className="p-5 md:p-6 space-y-4" onSubmit={handleTransaction}>
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                {(['salary', 'advance'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => {
                    setMode(m);
                    setFormData({ ...formData, type: 'received', description: m === 'salary' ? 'Monthly Salary' : 'Fuel Advance' });
                  }} className={`flex-1 h-8 rounded-lg font-bold text-xs transition-all capitalize ${mode === m ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'}`}>
                    {m}
                  </button>
                ))}
              </div>

              {mode === "advance" && (
                <div className="flex p-1 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'received', description: 'Fuel Advance' })}
                    className={`flex-1 h-7 rounded-lg font-bold text-[11px] transition-all ${formData.type === 'received' ? 'bg-indigo-600 text-white' : 'text-indigo-600'}`}>
                    Give Advance
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'sent', description: 'Advance Recovery' })}
                    className={`flex-1 h-7 rounded-lg font-bold text-[11px] transition-all ${formData.type === 'sent' ? 'bg-rose-600 text-white' : 'text-indigo-600'}`}>
                    Recover Advance
                  </button>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Account</label>
                <select required value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20">
                  <option value="">Select Account...</option>
                  {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Amount (₹)</label>
                  <input type="number" required placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-bold text-xs text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Payment Method</label>
                  <select value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20">
                    {availableModes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Notes / Description</label>
                <input type="text" required placeholder="Add notes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <button type="submit" disabled={modalLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs">
                {modalLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Confirm Entry
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LedgerModal;