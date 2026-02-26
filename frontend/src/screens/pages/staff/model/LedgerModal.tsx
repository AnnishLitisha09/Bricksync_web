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
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Manage Funds</h2>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Staff Ledger Entry</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-colors text-slate-400"><X size={24} /></button>
            </div>
            <form className="p-10 space-y-6" onSubmit={handleTransaction}>
              <div className="flex p-1.5 bg-slate-100 rounded-[2rem]">
                {(['salary', 'advance'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => {
                    setMode(m);
                    setFormData({ ...formData, type: 'received', description: m === 'salary' ? 'Monthly Salary' : 'Fuel Advance' });
                  }} className={`flex-1 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>
                    {m}
                  </button>
                ))}
              </div>

              {mode === "advance" && (
                <div className="flex p-1 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'received', description: 'Fuel Advance' })}
                    className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${formData.type === 'received' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}>
                    Give Advance
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'sent', description: 'Advance Recovery' })}
                    className={`flex-1 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${formData.type === 'sent' ? 'bg-rose-600 text-white' : 'text-indigo-400'}`}>
                    Recover Advance
                  </button>
                </div>
              )}

              <select required value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black text-slate-800 outline-none">
                <option value="">Select Account...</option>
                {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black" />
                <select value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black">
                  {availableModes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black" />
              <input type="text" required placeholder="Notes..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black" />

              <button type="submit" disabled={modalLoading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3">
                {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Confirm Entry
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LedgerModal;