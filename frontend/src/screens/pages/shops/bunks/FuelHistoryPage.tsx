import { AnimatePresence, motion } from "framer-motion";
import { 
    ArrowLeft, 
    Droplets, 
    Fuel, 
    Landmark, 
    LayoutList, 
    Plus, 
    TrendingUp, 
    Wallet, 
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    Download // New Icon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { pdf } from "@react-pdf/renderer"; // New Import
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import { useBankStore } from "../../../../store/bankStore";
import AddPaymentModal from "./AddPaymentModal";
import { FuelStatementPDF } from "./FuelStatementPDF"; // Import the template below

type TabType = 'all' | 'logs' | 'statements';
interface Transaction {
  id?: number; amount: number; type: 'fuel' | 'statement'; sortDate: Date;
  volume?: number; isVerified?: boolean; vehicle?: { vehicleName: string; vehicleNumber: string };
  bank?: { name: string; holderName: string }; description?: string; payment_mode?: string; 
}

export default function FuelHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bunkId = searchParams.get("bunkId");
  const bunkName = searchParams.get("bunkName") || "Station";

  const { banks, fetchBanks } = useBankStore();
  const [fuelLogs, setFuelLogs] = useState<Transaction[]>([]);
  const [statements, setStatements] = useState<Transaction[]>([]);
  const [combinedTimeline, setCombinedTimeline] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState({ totalFuel: 0, totalPaid: 0, outstanding: 0 });

  useEffect(() => {
    fetchBanks();
    if (bunkId) fetchData();
  }, [bunkId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fuelRes, statementRes] = await Promise.all([
        fetch(`${BASE_URL}/vehicle-fuels`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/fuel-statements/`, { headers: getAuthHeader() })
      ]);

      const fuelData = await fuelRes.json();
      const statementData = await statementRes.json();

      const filteredLogs = fuelData.filter((item: any) => item.bunkId === Number(bunkId))
        .map((item: any) => ({ ...item, type: 'fuel', sortDate: new Date(item.date) }));
      
      const filteredStatements = (statementData.data || []).filter((s: any) => s.bunk_id === Number(bunkId))
        .map((item: any) => ({ ...item, type: 'statement', sortDate: new Date(item.createdAt || item.date) }));
      
      const fuelTotal = filteredLogs.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
      const paidTotal = filteredStatements.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

      const combined = [...filteredLogs, ...filteredStatements].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

      setFuelLogs(filteredLogs.sort((a: any, b: any) => b.sortDate.getTime() - a.sortDate.getTime()));
      setStatements(filteredStatements.sort((a: any, b: any) => b.sortDate.getTime() - a.sortDate.getTime()));
      setCombinedTimeline(combined);
      setSummary({ totalFuel: fuelTotal, totalPaid: paidTotal, outstanding: fuelTotal - paidTotal });
    } catch (err) { console.error("Fetch error", err); } finally { setLoading(false); }
  };

  const handlePaymentSubmit = async (formData: any) => {
    const response = await fetch(`${BASE_URL}/fuel-statements/`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bunk_id: Number(bunkId),
        bank_id: Number(formData.bankId),
        amount: Number(formData.amount),
        payment_mode: formData.payment_mode,
        description: formData.description
      })
    });
    if (!response.ok) throw new Error("Payment failed");
    fetchData();
  };

  // PDF Generation Trigger
  const downloadPDF = async () => {
    const doc = <FuelStatementPDF 
      transactions={currentData} 
      summary={summary} 
      bunkName={bunkName} 
    />;
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bunkName.replace(/\s+/g, '_')}_Statement.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentData = activeTab === 'all' ? combinedTimeline : activeTab === 'logs' ? fuelLogs : statements;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 space-y-8 max-w-7xl mx-auto"
    >
      {/* NAVIGATION & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black text-[10px] tracking-[0.2em]"
          >
            <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            STATION DIRECTORY
          </button>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{bunkName}</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
          >
            <Wallet size={16} strokeWidth={2.5} /> Record Payment
          </button>
          <button 
            onClick={() => navigate("/vehicles/fuel/add")} 
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-200"
          >
            <Plus size={16} strokeWidth={2.5} /> New Entry
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-10">
            <div className="h-24 w-24 flex-shrink-0 bg-slate-950 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-slate-200">
                <Fuel size={40} strokeWidth={2} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 flex-grow">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fuel Used</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹{summary.totalFuel.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Settled</p>
                    <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{summary.totalPaid.toLocaleString()}</p>
                </div>
                <div className="hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Visits</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{fuelLogs.length}</p>
                </div>
            </div>
        </div>

        <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-200 relative overflow-hidden group">
          <TrendingUp size={160} className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          <p className="text-[10px] font-black text-orange-100 uppercase tracking-[0.2em] mb-2">Balance Due</p>
          <p className="text-5xl font-black tabular-nums tracking-tighter">₹{summary.outstanding.toLocaleString()}</p>
          <div className="mt-8 flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
            <AlertCircle size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Awaiting Settlement</span>
          </div>
        </div>
      </div>

      {/* DATA SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
                {(['all', 'logs', 'statements'] as TabType[]).map((tab) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)} 
                        className={`px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-950 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="SEARCH..." 
                        className="bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-slate-900 transition-all w-full md:w-60 shadow-sm"
                    />
                </div>
                
                {/* PDF DOWNLOAD BUTTON */}
                <button 
                  onClick={downloadPDF}
                  className="flex items-center gap-2 p-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm"
                  title="Download as PDF"
                >
                    <Download size={20} strokeWidth={2.5} />
                </button>

                <button className="p-3.5 bg-white border-2 border-slate-100 rounded-2xl text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                    <Filter size={20} strokeWidth={2.5} />
                </button>
            </div>
        </div>

        {/* MODERN TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Date & Status</th>
                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Identity</th>
                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Quantities</th>
                            <th className="px-10 py-7 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-right">Value (INR)</th>
                            <th className="pr-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <TableLoader />
                            ) : currentData.length > 0 ? (
                                currentData.map((tx, idx) => (
                                    <motion.tr 
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group hover:bg-slate-50/80 transition-all relative cursor-pointer"
                                    >
                                        <td className="px-10 py-8 relative">
                                            <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full transition-all group-hover:top-0 group-hover:bottom-0 ${tx.type === 'fuel' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`} />
                                            <div className="flex items-center gap-6">
                                                <div className="text-center min-w-[40px]">
                                                    <p className="text-xl font-black text-slate-900 leading-none">{tx.sortDate.getDate()}</p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">{tx.sortDate.toLocaleDateString('en-IN', { month: 'short' })}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg ${tx.type === 'fuel' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {tx.type}
                                                        </span>
                                                        {tx.type === 'fuel' && (
                                                            tx.isVerified ? 
                                                            <CheckCircle2 size={12} className="text-emerald-500" /> : 
                                                            <AlertCircle size={12} className="text-red-400 animate-pulse" />
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest">{tx.sortDate.toLocaleDateString('en-IN', { year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {tx.type === 'fuel' ? (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{tx.vehicle?.vehicleName}</p>
                                                    <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md w-fit">
                                                        {tx.vehicle?.vehicleNumber}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Landmark size={14} className="text-slate-400" strokeWidth={3} />
                                                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">{tx.bank?.name}</p>
                                                    </div>
                                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.15em]">{tx.payment_mode}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            {tx.type === 'fuel' ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-xl"><Droplets size={14} className="text-blue-500" strokeWidth={3} /></div>
                                                    <div>
                                                        <p className="text-sm font-mono font-black text-slate-900">{tx.volume}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LITRES</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-500 font-bold italic leading-relaxed max-w-[200px] line-clamp-2 uppercase tracking-tighter">
                                                    {tx.description || "Bunk Settlement"}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="space-y-0.5">
                                                <p className={`text-xl font-mono font-black tracking-tighter ${tx.type === 'fuel' ? 'text-slate-900' : 'text-emerald-600'}`}>
                                                    {tx.type === 'statement' ? '-' : ''}₹{tx.amount.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </td>
                                      
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                                <LayoutList size={48} className="text-slate-200" strokeWidth={1} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-black uppercase tracking-[0.3em] text-xs text-slate-900 underline underline-offset-8 decoration-orange-500">History is Empty</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No activity recorded for this period</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      <AddPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handlePaymentSubmit} 
        banks={banks} 
        bunkName={bunkName} 
      />
    </motion.div>
  );
}

function TableLoader() {
    return (
        <>
            {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-10 py-10"><div className="h-14 w-40 bg-slate-100 rounded-2xl" /></td>
                    <td className="px-10 py-10"><div className="h-14 w-48 bg-slate-100 rounded-2xl" /></td>
                    <td className="px-10 py-10"><div className="h-14 w-28 bg-slate-100 rounded-2xl" /></td>
                    <td className="px-10 py-10 text-right"><div className="h-14 w-24 bg-slate-100 rounded-2xl ml-auto" /></td>
                    <td></td>
                </tr>
            ))}
        </>
    );
}