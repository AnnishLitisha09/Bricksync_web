import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Gauge,
  History,
  Landmark,
  LayoutList,
  Loader2,
  Plus,
  ReceiptText,
  TrendingUp,
  Wallet,
  Wrench,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import { useBankStore } from "../../../../store/bankStore";

// --- TYPES ---
type TabType = 'all' | 'logs' | 'statements';

interface Transaction {
  id?: number;
  amount: number;
  date?: string;
  createdAt?: string;
  type: 'service' | 'statement';
  sortDate: Date;
  topic?: string;
  description?: string;
  kilometer?: number;
  vehicle?: { vehicleName: string; vehicleNumber: string };
  bank?: { name: string; holderName: string };
  payment_mode?: string;
}

export default function ServiceHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const shopId = searchParams.get("shopId");
  const shopName = searchParams.get("shopName") || "Unknown Workshop";

  const { banks, fetchBanks } = useBankStore();

  // Data States
  const [serviceLogs, setServiceLogs] = useState<Transaction[]>([]);
  const [statements, setStatements] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Pagination & Loading States
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    bankId: "",
    payment_mode: "",
    description: ""
  });

  const [summary, setSummary] = useState({
    totalService: 0,
    totalPaid: 0,
    outstanding: 0
  });

  // --- FIXED INFINITE SCROLL LOGIC ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const selectedBankData = useMemo(() =>
    banks.find(b => b.id.toString() === paymentForm.bankId),
    [paymentForm.bankId, banks]);

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
    fetchBanks();
  }, [fetchBanks]);

  useEffect(() => {
    if (shopId) fetchData(page);
  }, [shopId, page]);

  useEffect(() => {
    if (availableModes.length > 0) {
      setPaymentForm(prev => ({ ...prev, payment_mode: availableModes[0] }));
    } else {
      setPaymentForm(prev => ({ ...prev, payment_mode: "" }));
    }
  }, [availableModes]);

  const fetchData = async (pageNum: number) => {
    if (!shopId) return;
    try {
      setLoading(true);
      const [serviceRes, statementRes] = await Promise.all([
        fetch(`${BASE_URL}/vehicle-services?page=${pageNum}&limit=10`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/service-statements`, { headers: getAuthHeader() })
      ]);

      const serviceData = await serviceRes.json();
      const statementData = await statementRes.json();

      const logsArray = Array.isArray(serviceData.data) ? serviceData.data : (serviceData || []);
      const newLogs: Transaction[] = logsArray
        .filter((item: any) => item.serviceShopId === Number(shopId))
        .map((item: any) => ({
          ...item,
          type: 'service',
          sortDate: new Date(item.date),
        }));

      const filteredStatements: Transaction[] = (statementData.data || [])
        .filter((s: any) => s.service_shop_id === Number(shopId))
        .map((item: any) => ({
          ...item,
          type: 'statement',
          sortDate: new Date(item.createdAt || item.date),
        }));

      if (newLogs.length < 10) setHasMore(false);

      setServiceLogs(prev => pageNum === 1 ? newLogs : [...prev, ...newLogs]);
      setStatements(filteredStatements);

      const totalP = filteredStatements.reduce((a, c) => a + Number(c.amount), 0);

      setSummary(prev => {
        const currentTotalS = pageNum === 1 ? newLogs.reduce((a, c) => a + Number(c.amount), 0) : prev.totalService;
        return {
          totalService: currentTotalS,
          totalPaid: totalP,
          outstanding: currentTotalS - totalP
        };
      });
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const combinedTimeline = useMemo(() => {
    return [...serviceLogs, ...statements].sort((a, b) =>
      b.sortDate.getTime() - a.sortDate.getTime()
    );
  }, [serviceLogs, statements]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bankId || !paymentForm.amount || !paymentForm.payment_mode) return;
    try {
      setIsSubmitting(true);
      const payload = {
        service_shop_id: Number(shopId),
        bank_id: Number(paymentForm.bankId),
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        description: paymentForm.description
      };
      const response = await fetch(`${BASE_URL}/service-statements`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Payment failed");
      setIsModalOpen(false);
      setPaymentForm({ amount: "", bankId: "", payment_mode: "", description: "" });

      setPage(1);
      setHasMore(true);
      setServiceLogs([]);
      fetchData(1);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-all font-black uppercase tracking-[0.2em] text-[10px]">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-blue-50 transition-all"><ArrowLeft size={16} /></div>
          Back to Hubs
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
            <Wallet size={16} /> Record Payment
          </button>

          <button onClick={() => navigate("/vehicles/services/add")} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 p-5 bg-blue-50 rounded-3xl text-blue-600"><Wrench size={40} strokeWidth={2.5} /></div>
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Partner Workshop</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{shopName}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400 font-bold text-xs">Total Service: <span className="text-slate-900">₹{summary.totalService.toLocaleString()}</span></p>
              <div className="w-[1px] h-3 bg-slate-200" />
              <p className="text-slate-400 font-bold text-xs">Paid: <span className="text-emerald-600">₹{summary.totalPaid.toLocaleString()}</span></p>
            </div>
          </div>
        </div>
        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform"><TrendingUp size={120} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] opacity-80 mb-2">Net Outstanding</p>
            <p className="text-4xl font-black tabular-nums">₹{summary.outstanding.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">Live Balance</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm overflow-x-auto">
        {(['all', 'logs', 'statements'] as TabType[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? (tab === 'all' ? 'bg-blue-600 text-white' : tab === 'logs' ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white') : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'all' && <LayoutList size={14} />}
            {tab === 'logs' && <History size={14} />}
            {tab === 'statements' && <ReceiptText size={14} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {activeTab === 'all' && combinedTimeline.map((item, idx) => (
          <div key={`${item.id}-${idx}`} ref={idx === combinedTimeline.length - 1 ? lastElementRef : null}>
            {item.type === 'service' ? <ServiceLogRow log={item} idx={idx} /> : <StatementRow st={item} idx={idx} />}
          </div>
        ))}
        {activeTab === 'logs' && serviceLogs.map((log, idx) => (
          <div key={`${log.id}-${idx}`} ref={idx === serviceLogs.length - 1 ? lastElementRef : null}>
            <ServiceLogRow log={log} idx={idx} />
          </div>
        ))}
        {activeTab === 'statements' && statements.map((st, idx) => (
          <div key={`${st.id}-${idx}`} ref={idx === statements.length - 1 ? lastElementRef : null}>
            <StatementRow st={st} idx={idx} />
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {(!loading && (activeTab === 'all' ? combinedTimeline : activeTab === 'logs' ? serviceLogs : statements).length === 0) &&
          <EmptyState icon={<LayoutList size={40} />} label="No Transactions Found" />
        }
      </div>

      {/* --- RECORD PAYMENT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Add Payment</h2>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Record Settlement</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
              </div>

              <form className="p-8 space-y-6" onSubmit={handlePaymentSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Receiving Workshop</label>
                  <input disabled value={shopName} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Source Bank Account</label>
                  <select
                    required
                    value={paymentForm.bankId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="">Select a Bank...</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Mode</label>
                    <select
                      disabled={!paymentForm.bankId || availableModes.length === 0}
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800"
                      value={paymentForm.payment_mode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                    >
                      {!paymentForm.bankId && <option value="">Select Bank First</option>}
                      {availableModes.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount</label>
                    <input type="number" required placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !paymentForm.bankId || !paymentForm.payment_mode}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isSubmitting ? "Processing..." : "Confirm Settlement"}
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
function ServiceLogRow({ log, idx }: { log: Transaction; idx: number }) {
  const date = log.sortDate;
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="group bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 mb-4">
      <div className="w-full md:w-32 h-24 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center group-hover:bg-blue-50 transition-colors">
        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{date.getFullYear()}</span>
        <span className="text-2xl font-black text-slate-800 leading-none">{date.getDate()}</span>
        <span className="text-[10px] font-black uppercase text-blue-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{log.topic || "Routine Service"}</h3>
          <p className="text-slate-400 text-sm font-medium mt-1 line-clamp-1">{log.description || "General maintenance and repairs."}</p>
        </div>
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Odometer</p>
            <div className="flex items-center gap-2 text-slate-700">
              <Gauge size={14} className="text-blue-500" />
              <span className="text-sm font-black">{log.kilometer?.toLocaleString()} KM</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-slate-200" />
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Amount</p>
            <span className="text-xl font-black text-slate-900">₹{log.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="w-full md:w-56 p-4 rounded-[1.5rem] bg-slate-900 text-white shadow-lg">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Vehicle</p>
        <p className="font-black text-sm uppercase truncate">{log.vehicle?.vehicleName || "Unknown"}</p>
        <span className="text-[10px] font-mono text-blue-400">{log.vehicle?.vehicleNumber || "N/A"}</span>
      </div>
    </motion.div>
  );
}

function StatementRow({ st, idx }: { st: Transaction; idx: number }) {
  const date = st.sortDate;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-emerald-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 mb-4">
      <div className="w-full md:w-32 h-24 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-emerald-600/50 uppercase mb-1">PAID</span>
        <span className="text-2xl font-black text-emerald-700 leading-none">{date.getDate()}</span>
        <span className="text-[10px] font-black uppercase text-emerald-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><Landmark size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clearance</h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{st.bank?.name || 'Bank'}</p>
                <div className="w-1 h-1 bg-emerald-300 rounded-full" />
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-md border border-emerald-100">
                  {st.payment_mode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Amount Paid</p>
            <span className="text-xl font-black text-emerald-700">₹{st.amount.toLocaleString()}</span>
          </div>
        </div>
        {st.description && (
          <div className="mt-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 italic">"{st.description}"</p>
          </div>
        )}
      </div>
      <div className="w-full md:w-56 p-4 rounded-[1.5rem] bg-emerald-900 text-white shadow-xl shadow-emerald-100">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Confirmed</p>
        <p className="font-black text-[10px] uppercase truncate">{st.bank?.holderName || 'Account Holder'}</p>
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