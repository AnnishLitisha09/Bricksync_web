import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    CreditCard,
    Droplets,
    Fuel,
    History,
    Landmark,
    LayoutList,
    Loader2,
    Plus,
    ReceiptText,
    Smartphone,
    TrendingUp,
    Wallet,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import { useBankStore } from "../../../../store/bankStore";

// --- TYPES & INTERFACES ---
type TabType = 'all' | 'logs' | 'statements';

interface Vehicle {
  vehicleName: string;
  vehicleNumber: string;
}

interface Transaction {
  id?: number;
  fuelId?: number;
  amount: number;
  date?: string;
  createdAt?: string;
  type: 'fuel' | 'statement';
  sortDate: Date;
  volume?: number;
  kilometer?: number;
  isVerified?: boolean;
  vehicle?: Vehicle;
  bank?: { name: string; holderName: string };
}

export default function FuelHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bunkId = searchParams.get("bunkId");
  const bunkName = searchParams.get("bunkName");

  const { banks, fetchBanks } = useBankStore();

  const [fuelLogs, setFuelLogs] = useState<Transaction[]>([]);
  const [statements, setStatements] = useState<Transaction[]>([]);
  const [combinedTimeline, setCombinedTimeline] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    bankId: "",
    mode: "Bank Transfer"
  });
  
  const [summary, setSummary] = useState({
    totalFuel: 0,
    totalPaid: 0,
    outstanding: 0
  });

  const selectedBankData = useMemo(() => 
    banks.find(b => b.id.toString() === paymentForm.bankId), 
  [paymentForm.bankId, banks]);

  useEffect(() => {
    fetchBanks();
    if (bunkId) fetchData();
  }, [bunkId]);

  useEffect(() => {
    if (selectedBankData) {
      setPaymentForm(prev => ({
        ...prev,
        mode: selectedBankData.Gpay ? "GPay / UPI" : "Bank Transfer"
      }));
    }
  }, [selectedBankData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fuelRes, statementRes] = await Promise.all([
        fetch(`${BASE_URL}/vehicle-fuels`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/fuel-statements/`, { headers: getAuthHeader() })
      ]);

      const fuelData = await fuelRes.json();
      const statementData = await statementRes.json();

      const filteredLogs: Transaction[] = fuelData
        .filter((item: any) => item.bunkId === Number(bunkId))
        .map((item: any) => ({ ...item, type: 'fuel', sortDate: new Date(item.date) }));
      
      const filteredStatements: Transaction[] = (statementData.data || [])
        .filter((s: any) => s.bunk_id === Number(bunkId))
        .map((item: any) => ({ ...item, type: 'statement', sortDate: new Date(item.createdAt || item.date) }));
      
      const fuelTotal = filteredLogs.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const paidTotal = filteredStatements.reduce((acc, curr) => acc + Number(curr.amount), 0);

      const combined = [...filteredLogs, ...filteredStatements].sort((a, b) => 
        b.sortDate.getTime() - a.sortDate.getTime()
      );

      setFuelLogs(filteredLogs.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()));
      setStatements(filteredStatements.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()));
      setCombinedTimeline(combined);
      setSummary({ totalFuel: fuelTotal, totalPaid: paidTotal, outstanding: fuelTotal - paidTotal });
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * UPDATED: Integrated with POST /fuel-statements/
   */
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Log the local state before starting the request
    console.log("🚀 Starting Payment Submission...", {
      bunkId: bunkId,
      bankId: paymentForm.bankId,
      amount: paymentForm.amount,
      mode: paymentForm.mode
    });

    if (!paymentForm.bankId || !paymentForm.amount) {
      console.warn("⚠️ Missing required fields: bankId or amount");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        bunk_id: Number(bunkId),
        bank_id: Number(paymentForm.bankId),
        amount: Number(paymentForm.amount)
      };

      console.log("📤 Sending Payload to API:", payload);

      const response = await fetch(`${BASE_URL}/fuel-statements/`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // 2. Check for HTTP errors (4xx or 5xx)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Server Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Payment Success Result:", result);

      setIsModalOpen(false);
      setPaymentForm({ amount: "", bankId: "", mode: "Bank Transfer" });
      fetchData(); 
    } catch (err: any) {
      // 3. Log the final error detail
      console.error("🔴 Submission Failed:", err.message);
      alert(`Failed to process payment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-slate-400 hover:text-orange-600 transition-all font-black uppercase tracking-[0.2em] text-[10px]">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-orange-50 transition-all"><ArrowLeft size={16} /></div>
          Back to Network
        </button>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
            <Wallet size={16} /> Record Payment
          </button>
          <button onClick={() => navigate("/vehicles/fuel/add")} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-slate-200">
            <Plus size={16} /> New Fuel Entry
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 p-5 bg-orange-50 rounded-3xl text-orange-600"><Fuel size={40} strokeWidth={2.5} /></div>
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1">Filling Station</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{bunkName}</h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-slate-400 font-bold text-xs">Total Fuel: <span className="text-slate-900">₹{summary.totalFuel.toLocaleString()}</span></p>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <p className="text-slate-400 font-bold text-xs">Paid: <span className="text-emerald-600">₹{summary.totalPaid.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
        <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform"><TrendingUp size={120} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-orange-100 uppercase tracking-[0.2em] opacity-80 mb-2">Net Outstanding</p>
            <p className="text-4xl font-black tabular-nums">₹{summary.outstanding.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">Live Balance</div>
          </div>
        </div>
      </div>

      {/* TABS & LISTING */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm overflow-x-auto">
        {(['all', 'logs', 'statements'] as TabType[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? (tab === 'all' ? 'bg-blue-600 text-white' : tab === 'logs' ? 'bg-slate-900 text-white' : 'bg-orange-600 text-white') : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'all' && <LayoutList size={14} />}
            {tab === 'logs' && <History size={14} />}
            {tab === 'statements' && <ReceiptText size={14} />}
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
           <div key="loading" className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white/40 animate-pulse rounded-[2rem] border border-white" />)}
           </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 gap-4">
            {activeTab === 'all' && combinedTimeline.map((item, idx) => item.type === 'fuel' ? <FuelLogRow key={idx} log={item} idx={idx} /> : <StatementRow key={idx} st={item} idx={idx} />)}
            {activeTab === 'logs' && fuelLogs.map((log, idx) => <FuelLogRow key={idx} log={log} idx={idx} />)}
            {activeTab === 'statements' && statements.map((st, idx) => <StatementRow key={idx} st={st} idx={idx} />)}
            {(activeTab === 'all' ? combinedTimeline : activeTab === 'logs' ? fuelLogs : statements).length === 0 && <EmptyState icon={<LayoutList size={40}/>} label="No Transactions Found" />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADD PAYMENT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Add Payment</h2>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Select Source & Mode</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20}/></button>
                </div>
                
                <form className="p-8 space-y-6" onSubmit={handlePaymentSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Receiving Station</label>
                        <div className="relative">
                            <select disabled className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 appearance-none"><option>{bunkName}</option></select>
                            <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Source Bank Account</label>
                        <div className="relative">
                            <select 
                                required
                                value={paymentForm.bankId}
                                onChange={(e) => setPaymentForm({...paymentForm, bankId: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none appearance-none transition-all"
                            >
                                <option value="">Select a Bank...</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>
                                ))}
                            </select>
                            <Landmark className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Mode</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 appearance-none focus:ring-2 ring-emerald-500/20 outline-none transition-all"
                                    value={paymentForm.mode}
                                    onChange={(e) => setPaymentForm({...paymentForm, mode: e.target.value})}
                                >
                                    {selectedBankData?.Gpay ? (
                                        <option value="GPay / UPI">GPay / UPI</option>
                                    ) : (
                                        <>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Cheque">Cheque</option>
                                        </>
                                    )}
                                </select>
                                {selectedBankData?.Gpay ? <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500" size={18} /> : <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount</label>
                            <div className="relative">
                                <input type="number" required placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none transition-all" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-emerald-600">₹</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {isSubmitting ? "Processing..." : "Confirm Payment"}
                    </button>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- SUB-COMPONENTS ---
function FuelLogRow({ log, idx }: { log: Transaction; idx: number }) {
    const date = log.sortDate;
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className={`group bg-white p-2 pr-6 rounded-[2rem] shadow-sm border transition-all flex flex-col md:flex-row items-center gap-6 ${!log.isVerified ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:shadow-xl'}`}>
          <div className="w-full md:w-32 h-24 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{date.getFullYear()}</span>
              <span className="text-2xl font-black text-slate-800 leading-none">{date.getDate()}</span>
              <span className="text-[10px] font-black uppercase text-orange-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
          </div>
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Droplets size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-800">{log.volume} Litres</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.isVerified ? "Verified" : "Pending"}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Expense</p><span className="text-xl font-black text-slate-900">₹{log.amount.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="w-full md:w-56 p-4 rounded-[1.5rem] bg-slate-900 text-white">
             <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Vehicle</p>
             <p className="font-black text-sm uppercase truncate">{log.vehicle?.vehicleName}</p>
             <span className="text-[10px] font-mono text-orange-400">{log.vehicle?.vehicleNumber}</span>
          </div>
        </motion.div>
    );
}

function StatementRow({ st, idx }: { st: Transaction; idx: number }) {
    const date = st.sortDate;
    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-emerald-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-32 h-24 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-emerald-600/50 uppercase mb-1">PAID</span>
                <span className="text-2xl font-black text-emerald-700 leading-none">{date.getDate()}</span>
                <span className="text-[10px] font-black uppercase text-emerald-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
            </div>
            <div className="flex-1 flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><Landmark size={24} /></div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clearance</h3>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{st.bank?.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Amount</p>
                    <span className="text-xl font-black text-emerald-700">₹{st.amount.toLocaleString()}</span>
                </div>
            </div>
            <div className="w-full md:w-56 p-4 rounded-[1.5rem] bg-emerald-900 text-white shadow-xl shadow-emerald-100">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Confirmed</p>
                <p className="font-black text-[10px] uppercase truncate">{st.bank?.holderName}</p>
            </div>
        </motion.div>
    );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <div className="flex justify-center text-slate-200 mb-4">{icon}</div>
            <h3 className="text-slate-800 font-black uppercase tracking-tighter">{label}</h3>
        </div>
    );
}