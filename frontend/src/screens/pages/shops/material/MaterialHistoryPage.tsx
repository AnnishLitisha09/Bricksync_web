import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  History,
  Info,
  Plus,
  Receipt,
  Search,
  Store,
  TrendingUp,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// --- TYPES ---
interface Transaction {
  id: string;
  date: string;
  type: "PURCHASE" | "PAYMENT";
  description: string;
  amount: number;
  invoiceNo?: string;
  status: "COMPLETED" | "PENDING";
}

export default function MaterialHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopName = searchParams.get("shopName") || "Merchant Ledger";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- SAMPLE DATA ---
  const [transactions] = useState<Transaction[]>([
    { id: "1", date: "2024-03-15", type: "PURCHASE", description: "Bulk Cement & Steel Rods", amount: 45000, invoiceNo: "INV-8821", status: "COMPLETED" },
    { id: "2", date: "2024-03-12", type: "PAYMENT", description: "Part payment via Bank Transfer", amount: 20000, status: "COMPLETED" },
    { id: "3", date: "2024-03-10", type: "PURCHASE", description: "Paints and Finishing Material", amount: 12500, invoiceNo: "INV-8790", status: "COMPLETED" },
    { id: "4", date: "2024-03-05", type: "PAYMENT", description: "Cash Payment", amount: 5000, status: "COMPLETED" },
  ]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, transactions]);

  const totalPurchases = transactions.filter(t => t.type === "PURCHASE").reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = transactions.filter(t => t.type === "PAYMENT").reduce((acc, curr) => acc + curr.amount, 0);
  const balanceOutstanding = totalPurchases - totalPaid;

  const handleRequestStatement = () => {
    // Toast removed as requested
    console.log("Statement requested");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 font-sans"
    >
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all group"
          >
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
              <Store className="text-indigo-600" size={28} />
              {shopName}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Transaction History & Statement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
            <Download size={16} /> Export PDF
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Plus size={18} /> Record Entry
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARD */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative bg-slate-900 rounded-[3rem] p-8 lg:p-10 text-white overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between h-full">
            <div className="space-y-6">
              <div>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Current Outstanding</p>
                <h2 className="text-5xl lg:text-6xl font-black tabular-nums tracking-tighter">
                  ₹{balanceOutstanding.toLocaleString()}
                </h2>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-xs font-bold bg-white/5 border border-white/10 w-fit px-4 py-2 rounded-full">
                <Info size={14} className="text-indigo-400" />
                Next payment suggested by 25th March
              </div>
            </div>
            
            <div className="mt-8 md:mt-0 flex flex-col justify-end gap-4 border-l border-white/10 md:pl-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl"><TrendingUp size={20} className="text-emerald-400" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Paid</p>
                  <p className="text-lg font-black text-emerald-400 font-mono">₹{totalPaid.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 rounded-2xl"><Receipt size={20} className="text-indigo-400" /></div>
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Purchases</p>
                  <p className="text-lg font-black text-indigo-400 font-mono">₹{totalPurchases.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 flex flex-col justify-between shadow-sm">
           <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <History size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase italic">Recent Ledger Activity</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">System tracking is active. All financial logs are verified and synced with cloud backups.</p>
           </div>
           <button 
             onClick={handleRequestStatement}
             className="w-full mt-6 py-4 bg-slate-50 text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
           >
              Request Statement
           </button>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><Receipt size={18} className="text-indigo-600" /></div>
            Ledger Entries
          </h3>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search description or invoice..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-xs w-full sm:w-64"
            />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Info</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map((t) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={t.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <CalendarDays size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tabular-nums">{t.date}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.invoiceNo || 'DIRECT PAYMENT'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{t.description}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          t.type === 'PURCHASE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {t.type === 'PURCHASE' ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                          {t.type}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className={`text-lg font-black tabular-nums ${
                          t.type === 'PURCHASE' ? 'text-slate-800' : 'text-emerald-600'
                        }`}>
                          {t.type === 'PAYMENT' && '-'} ₹{t.amount.toLocaleString()}
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center">
              <Search size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No entries found matching filters</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase italic tracking-tight">New Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium italic">Modal form fields would go here...</p>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Save Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}