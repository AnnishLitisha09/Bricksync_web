import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronLeft,
  HandCoins,
  History,
  Landmark,
  Loader2,
  Plus,
  Save,
  User,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, BASE_URL_NO_API, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import DriverInfoCard from "../../../components/staff/DriverInfoCard";
import WeeklyAttendance from "../../../components/staff/WeeklyAttendance";
import { useBankStore } from "../../../store/bankStore";

// FULLY UPDATED INTERFACE
interface APIUser {
  userid: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  amount: number; 
  imageUrl: string | null;
  aadharUrl: string | null;
  drivingLicenceUrl: string | null;
  drivingLicenceBackUrl: string | null;
  drivingLicenceValidity: string | null;
  userRole: number;
  createdAt: string;
}

interface Transaction {
  id: number;
  userid: number;
  amount: number;
  type: "sent" | "received";
  category: "salary" | "advance";
  paymentType: string;
  description: string;
  date: string;
  bank?: {
    name: string;
    accountNumber: string;
  };
}

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { banks, fetchBanks } = useBankStore();

  const [staff, setStaff] = useState<APIUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "salary" | "advance">("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [mode, setMode] = useState<"salary" | "advance">("salary");

  const [formData, setFormData] = useState({
    amount: "",
    type: "received" as "received" | "sent", 
    description: "",
    date: new Date().toISOString().split('T')[0],
    bankId: "",
    paymentType: ""
  });

  const selectedBankData = useMemo(() => 
    banks.find(b => b.id.toString() === formData.bankId), 
  [formData.bankId, banks]);

  const availableModes = useMemo(() => {
    if (!selectedBankData) return [];
    if (selectedBankData.name.toLowerCase() === 'cash') return ["CASH"];
    const modes = [];
    if (selectedBankData.gpay) modes.push("GPAY");
    if (selectedBankData.phonepe) modes.push("PHONEPE");
    if (selectedBankData.bankTransfer) modes.push("BANK TRANSFER");
    return modes;
  }, [selectedBankData]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchBanks();
      const [userRes, transRes] = await Promise.all([
        fetch(`${BASE_URL}/user`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL_NO_API}/wallet/transaction?userid=${id}`, { headers: getAuthHeader() })
      ]);
      
      const userData: APIUser[] = await userRes.json();
      const found = userData.find((u) => String(u.userid) === id);
      setStaff(found || null);

      const transData = await transRes.json();
      if (transData.success) setTransactions(transData.data);
    } catch (error) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [id, fetchBanks]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  useEffect(() => {
    if (availableModes.length > 0) {
      setFormData(prev => ({ ...prev, paymentType: availableModes[0] }));
    }
  }, [availableModes]);

  const remainingAdvance = useMemo(() => {
    return transactions
      .filter(t => t.category === "advance")
      .reduce((acc, t) => t.type === "received" ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter(t => t.category === filter);
  }, [transactions, filter]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankId) return toast.error("Please select a bank");

    setModalLoading(true);
    try {
      const payload = {
        userid: Number(id),
        bankName: selectedBankData?.name || "Cash",
        amount: Number(formData.amount),
        type: mode === 'salary' ? 'received' : formData.type,
        category: mode,
        paymentType: formData.paymentType,
        description: formData.description,
        date: formData.date
      };

      const res = await fetch(`${BASE_URL_NO_API}/wallet/transaction`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`${mode} recorded successfully`);
        setIsModalOpen(false);
        setFormData(prev => ({ ...prev, amount: "", description: "" }));
        fetchData();
      }
    } catch (err) {
      toast.error("Transaction failed");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading || !staff) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50/50 p-4 md:p-10 space-y-10 font-sans text-slate-900 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
            <ChevronLeft size={24}/>
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">
              {staff.name}
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Staff ID: {staff.userid}</p>
          </div>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
          <Plus size={18} /> Manage Ledger
        </button>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden">
          <div className="relative z-10 p-5 bg-indigo-50 rounded-3xl text-indigo-600">
             <User size={40} strokeWidth={2.5} />
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Onboarding Details</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{staff.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400 font-bold text-xs">Joined: <span className="text-slate-900">{new Date(staff.createdAt).toLocaleDateString()}</span></p>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <p className="text-slate-400 font-bold text-xs">Wallet: <span className="text-indigo-600 font-black">₹{staff.amount?.toLocaleString()}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-rose-500 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform"><HandCoins size={120} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em] opacity-80 mb-2">Total Advance</p>
            <p className="text-4xl font-black tabular-nums">₹{remainingAdvance.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest italic">Liability</div>
          </div>
        </div>
      </div>

      {/* PROFILE & ATTENDANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
            <DriverInfoCard staff={staff} fileBaseUrl={FILE_BASE_URL} />
        </div>
        <div className="lg:col-span-8">
            <WeeklyAttendance userId={id!} />
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><History size={20} className="text-indigo-500" /></div>
             <h3 className="text-xl font-black uppercase tracking-tight italic">Transaction Flow</h3>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
            {(['all', 'salary', 'advance'] as const).map((tab) => (
              <button 
                key={tab} 
                onClick={() => setFilter(tab)} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-indigo-200 transition-all shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${t.type === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'received' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md">{t.paymentType}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mt-0.5 uppercase italic">{t.description}</h4>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1 uppercase">
                         <CalendarDays size={12} /> {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                         <span className="ml-2 text-[10px] text-slate-300">• {t.bank?.name || 'Cash'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className={`text-2xl font-black tabular-nums ${t.type === 'received' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'received' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records found</p>
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTION MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Manage Funds</h2>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Staff Ledger Entry</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-colors text-slate-400"><X size={24} /></button>
              </div>

              <form className="p-10 space-y-6" onSubmit={handleTransaction}>
                <div className="flex p-1.5 bg-slate-100 rounded-[2rem]">
                  {(['salary', 'advance'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}>
                       {m}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Select</label>
                  <select required value={formData.bankId} onChange={(e) => setFormData({ ...formData, bankId: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 ring-indigo-500/20">
                    <option value="">Select Account...</option>
                    {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount (₹)</label>
                    <input type="number" required placeholder="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mode</label>
                    <select value={formData.paymentType} onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black text-slate-800">
                      {availableModes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {mode === 'advance' && (
                   <div className="grid grid-cols-2 gap-4">
                      <button type="button" onClick={() => setFormData({...formData, type: 'received'})} className={`py-4 rounded-3xl font-black text-[10px] uppercase border-2 transition-all ${formData.type === 'received' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-400 border-slate-100'}`}>Give</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'sent'})} className={`py-4 rounded-3xl font-black text-[10px] uppercase border-2 transition-all ${formData.type === 'sent' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'text-slate-400 border-slate-100'}`}>Recover</button>
                   </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes</label>
                  <input type="text" required placeholder="Entry description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 font-black text-slate-800" />
                </div>

                <button type="submit" disabled={modalLoading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                  {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                  Confirm Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ViewStaffDetail;