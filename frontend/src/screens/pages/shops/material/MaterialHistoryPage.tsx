import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  Plus,
  Receipt,
  Search,
  Store,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// --- TYPES ---
interface MaterialLog {
  id: string;
  date: string;
  material: "M-Sand" | "P-Sand" | "Aggregates" | "Cement";
  unitSize: "9 Field" | "6 Field" | "4 Field" | "Standard";
  amount: number;
  invoiceNo?: string;
}

export default function MaterialHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopName = searchParams.get("shopName") || "Merchant Ledger";
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- SAMPLE DATA ---
  const [logs] = useState<MaterialLog[]>([
    { id: "1", date: "2024-03-15", material: "M-Sand", unitSize: "9 Field", amount: 45000, invoiceNo: "INV-8821" },
    { id: "2", date: "2024-03-12", material: "P-Sand", unitSize: "6 Field", amount: 22000, invoiceNo: "INV-8810" },
    { id: "3", date: "2024-03-10", material: "M-Sand", unitSize: "9 Field", amount: 45000, invoiceNo: "INV-8790" },
    { id: "4", date: "2024-03-05", material: "Aggregates", unitSize: "6 Field", amount: 15000, invoiceNo: "INV-8750" },
  ]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.unitSize.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, logs]);

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
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Material Supply History</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
            <Download size={16} /> Export Report
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      {/* TRANSACTION LIST - Full Width Focus */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><Receipt size={18} className="text-indigo-600" /></div>
            Procurement Ledger
          </h3>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter M-Sand, 9 Field..." 
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
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Material</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Units (Size)</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence mode="popLayout">
                  {filteredLogs.map((l) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={l.id}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <CalendarDays size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tabular-nums">{l.date}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{l.invoiceNo || 'PENDING BILL'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-indigo-500" />
                           <p className="text-xs font-black text-slate-700 uppercase">{l.material}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                           {l.unitSize}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-lg font-black tabular-nums text-slate-800">
                           ₹{l.amount.toLocaleString()}
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="py-20 text-center">
              <Search size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No material entries found</p>
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
                <h3 className="text-xl font-black uppercase italic tracking-tight">Add Material Entry</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Material</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option>M-Sand</option>
                    <option>P-Sand</option>
                    <option>Aggregates</option>
                    <option>Cement</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Size</label>
                  <select className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option>9 Field</option>
                    <option>6 Field</option>
                    <option>4 Field</option>
                    <option>Standard</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Amount (₹)</label>
                  <input type="number" placeholder="0.00" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>

                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full mt-4 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}