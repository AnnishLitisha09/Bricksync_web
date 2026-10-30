import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Droplets,
  Fuel,
  History,
  Landmark,
  LayoutList,
  Loader2,
  Plus,
  ReceiptText,
  StickyNote,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import { useBankStore } from "../../../../store/bankStore";
import { generateFuelHistoryPDF } from "./fuelHistoryPdfTemplate";

// --- TYPES ---
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
  description?: string;
  payment_mode?: string;
}

export default function FuelHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bunkId = searchParams.get("bunkId");
  const bunkName = searchParams.get("bunkName") || "Unknown Station";

  const { banks, fetchBanks } = useBankStore();

  const [fuelLogs, setFuelLogs] = useState<Transaction[]>([]);
  const [statements, setStatements] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Pagination & Scroll States
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
    totalFuel: 0,
    totalPaid: 0,
    outstanding: 0
  });

  // --- INFINITE SCROLL LOGIC ---
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);

  useEffect(() => {
    loadingRef.current = loading;
    hasMoreRef.current = hasMore;
  }, [loading, hasMore]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingRef.current && hasMoreRef.current) {
        setPage(prev => prev + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, []);

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
    if (bunkId) fetchData(page);
  }, [bunkId, page]);

  useEffect(() => {
    if (availableModes.length > 0) {
      setPaymentForm(prev => ({ ...prev, payment_mode: availableModes[0] }));
    } else {
      setPaymentForm(prev => ({ ...prev, payment_mode: "" }));
    }
  }, [availableModes]);

  const fetchData = async (pageNum: number) => {
    if (!bunkId) return;
    try {
      setLoading(true);
      // We keep the bunk-specific search, adding page if your API supports it
      const [fuelRes, statementRes] = await Promise.all([
        fetch(`${BASE_URL}/vehicle-fuels/search/by-bunk-id?bunkId=${bunkId}&page=${pageNum}`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/fuel-statements/`, { headers: getAuthHeader() })
      ]);

      const fuelData = await fuelRes.json();
      const statementData = await statementRes.json();

      const logsArray = Array.isArray(fuelData) ? fuelData : (fuelData.fuels || []);
      const newLogs: Transaction[] = logsArray.map((item: any) => ({
        ...item,
        type: 'fuel',
        sortDate: new Date(item.date),
        vehicle: item.vehicle
      }));

      const filteredStatements: Transaction[] = (statementData.data || [])
        .filter((s: any) => s.bunk_id === Number(bunkId))
        .map((item: any) => ({
          ...item,
          type: 'statement',
          sortDate: new Date(item.createdAt || item.date),
          description: item.description,
          payment_mode: item.payment_mode
        }));

      if (newLogs.length < 10) setHasMore(false);

      setFuelLogs(prev => pageNum === 1 ? newLogs : [...prev, ...newLogs]);
      setStatements(filteredStatements);

      // Summary is usually based on the full history
      const paidTotal = filteredStatements.reduce((a, c) => a + Number(c.amount), 0);

      setSummary(prev => ({
        totalFuel: pageNum === 1 ? newLogs.reduce((a, c) => a + Number(c.amount), 0) : prev.totalFuel,
        totalPaid: paidTotal,
        outstanding: (pageNum === 1 ? newLogs.reduce((a, c) => a + Number(c.amount), 0) : prev.totalFuel) - paidTotal
      }));
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const combinedTimeline = useMemo(() => {
    return [...fuelLogs, ...statements].sort((a, b) =>
      b.sortDate.getTime() - a.sortDate.getTime()
    );
  }, [fuelLogs, statements]);

  const handleDownloadPdf = () => {
    generateFuelHistoryPDF(bunkName, combinedTimeline, summary);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.bankId || !paymentForm.amount || !paymentForm.payment_mode) return;
    try {
      setIsSubmitting(true);
      const payload = {
        bunk_id: Number(bunkId),
        bank_id: Number(paymentForm.bankId),
        amount: Number(paymentForm.amount),
        payment_mode: paymentForm.payment_mode,
        description: paymentForm.description
      };
      const response = await fetch(`${BASE_URL}/fuel-statements/`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Payment failed");
      setIsModalOpen(false);
      setPaymentForm({ amount: "", bankId: "", payment_mode: "", description: "" });

      // Reset to page 1 to refresh everything
      setPage(1);
      setHasMore(true);
      fetchData(1);
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in font-sans">

      {/* ─── HEADER & ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowLeft size={12} /> Bunk Network
            </button>
            <span className="text-xs font-bold text-slate-400">• Station Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
            {bunkName}
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Fuel dispense logs, bulk statement payments & outstanding settlement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Download size={14} className="text-indigo-600" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Wallet size={15} />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => navigate("/vehicles/fuel/add")}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>New Fuel Entry</span>
          </button>
        </div>
      </div>

      {/* ─── SUMMARY STATS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Dispensed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fuel Dispensed</p>
            <p className="text-2xl font-black text-slate-900 mt-1">₹{summary.totalFuel.toLocaleString('en-IN')}</p>
          </div>
          <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Fuel size={18} />
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Paid Out</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">₹{summary.totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Outstanding Due */}
        <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Due Balance</p>
            <p className="text-2xl font-black text-white mt-1">₹{summary.outstanding.toLocaleString('en-IN')}</p>
          </div>
          <div className="size-11 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex gap-1.5 p-1 bg-white border border-slate-200/80 rounded-xl w-fit shadow-2xs">
        {(['all', 'logs', 'statements'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'all' && <LayoutList size={13} />}
            {tab === 'logs' && <History size={13} />}
            {tab === 'statements' && <ReceiptText size={13} />}
            <span>{tab === 'all' ? 'All Transactions' : tab === 'logs' ? 'Fuel Entries' : 'Statements'}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {activeTab === 'all' && combinedTimeline.map((item, idx) => (
          <div key={`${item.id}-${idx}`} ref={idx === combinedTimeline.length - 1 ? lastElementRef : null}>
            {item.type === 'fuel' ? <FuelLogRow log={item} idx={idx} /> : <StatementRow st={item} idx={idx} />}
          </div>
        ))}
        {activeTab === 'logs' && fuelLogs.map((log, idx) => (
          <div key={`${log.id}-${idx}`} ref={idx === fuelLogs.length - 1 ? lastElementRef : null}>
            <FuelLogRow log={log} idx={idx} />
          </div>
        ))}
        {activeTab === 'statements' && statements.map((st, idx) => (
          <div key={`${st.id}-${idx}`} ref={idx === statements.length - 1 ? lastElementRef : null}>
            <StatementRow st={st} idx={idx} />
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-indigo-600" size={28} />
          </div>
        )}

        {!loading && (activeTab === 'all' ? combinedTimeline : activeTab === 'logs' ? fuelLogs : statements).length === 0 && (
          <EmptyState icon={<LayoutList size={40} />} label="No Transactions Found" />
        )}
      </div>

      {/* --- ADD PAYMENT MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Add Payment</h2>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Record Settlement</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"><X size={20} /></button>
              </div>

              <form className="p-8 space-y-6" onSubmit={handlePaymentSubmit}>
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
                    <select
                      required
                      value={paymentForm.bankId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, bankId: e.target.value })}
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
                        disabled={!paymentForm.bankId || availableModes.length === 0}
                        required
                        className={`w-full border rounded-2xl px-5 py-4 font-black text-slate-800 appearance-none focus:ring-2 ring-emerald-500/20 outline-none transition-all ${(!paymentForm.bankId || availableModes.length === 0) ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400' : 'bg-slate-50 border-slate-100'}`}
                        value={paymentForm.payment_mode}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                      >
                        {!paymentForm.bankId && <option value="">Select Bank First</option>}
                        {availableModes.map(mode => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                      <CreditCard className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount</label>
                    <div className="relative">
                      <input type="number" required placeholder="0.00" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none transition-all" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-emerald-600">₹</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Description</label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      placeholder="Enter transaction details..."
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 focus:ring-2 ring-emerald-500/20 outline-none transition-all resize-none"
                    />
                    <StickyNote className="absolute right-5 top-5 text-slate-300" size={18} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !paymentForm.bankId || !paymentForm.payment_mode}
                  className="w-full h-11 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                  <span>{isSubmitting ? "Processing..." : "Confirm Payment"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function FuelLogRow({ log, idx }: { log: Transaction; idx: number }) {
  const date = log.sortDate;
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className={`group bg-white p-2 pr-6 rounded-2xl shadow-sm border transition-all flex flex-col md:flex-row items-center gap-6 mb-4 ${!log.isVerified ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:shadow-xl'}`}>
      <div className="w-full md:w-32 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{date.getFullYear()}</span>
        <span className="text-2xl font-black text-slate-800 leading-none">{date.getDate()}</span>
        <span className="text-[10px] font-black uppercase text-indigo-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Droplets size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{log.volume} Litres</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{log.isVerified ? "Verified" : "Pending"}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase mb-1">Expense</p><span className="text-xl font-black text-slate-900">₹{log.amount.toLocaleString()}</span></div>
        </div>
      </div>
      <div className="w-full md:w-56 p-4 rounded-xl bg-slate-900 text-white">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Vehicle</p>
        <p className="font-black text-sm uppercase truncate">{log.vehicle?.vehicleName || 'N/A'}</p>
        <span className="text-[10px] font-mono text-indigo-300">{log.vehicle?.vehicleNumber || 'N/A'}</span>
      </div>
    </motion.div>
  );
}

function StatementRow({ st, idx }: { st: Transaction; idx: number }) {
  const date = st.sortDate;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="bg-white p-2 pr-6 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 mb-4">
      <div className="w-full md:w-32 h-24 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
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
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{st.bank?.name}</p>
                <div className="w-1 h-1 bg-emerald-300 rounded-full" />
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-md border border-emerald-100">
                  {st.payment_mode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Amount</p>
            <span className="text-xl font-black text-emerald-700">₹{st.amount.toLocaleString()}</span>
          </div>
        </div>
        {st.description && (
          <div className="mt-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 italic">"{st.description}"</p>
          </div>
        )}
      </div>
      <div className="w-full md:w-56 p-4 rounded-xl bg-emerald-900 text-white shadow-xl shadow-emerald-100">
        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Confirmed</p>
        <p className="font-black text-[10px] uppercase truncate">{st.bank?.holderName}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-center py-24 bg-white rounded-2xl border-4 border-dashed border-slate-100">
      <div className="flex justify-center text-slate-200 mb-4">{icon}</div>
      <h3 className="text-slate-800 font-black uppercase tracking-tighter">{label}</h3>
    </div>
  );
}