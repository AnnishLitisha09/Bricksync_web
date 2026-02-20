import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Calendar,
  Store,
  Users,
  Layers,
  HardHat,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductionHistory } from "../../../api/inventory";

interface ProductionLog {
  production_id: number;
  production_date: string;
  unit_produced: string;
  cement_used: string;
  cementProduct?: {
    product_name: string;
  };
  product: {
    product_name: string;
  };
  office: {
    office_name: string;
  };
  employees: {
    employee: {
      name: string;
    };
  }[];
}

export default function ProductionHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<ProductionLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    getProductionHistory()
      .then(setHistory)
      .catch(console.error);
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(log =>
      log.product.product_name.toLowerCase().includes(search.toLowerCase()) ||
      log.office.office_name.toLowerCase().includes(search.toLowerCase()) ||
      log.employees.some(e => e.employee?.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, history]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen bg-gray-50/50 p-3 md:p-8 space-y-4 md:space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4 md:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm text-slate-400 hover:text-orange-600 transition-all border border-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Production <span className="text-orange-600">History</span>
          </h1>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Manufacturing Logs</p>
        </div>
        <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm text-orange-600 border border-gray-100">
          <Filter size={18} />
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 md:p-4 rounded-3xl md:rounded-4xl shadow-sm border border-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 md:py-4 border-none rounded-xl md:rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Horizontal Scroll Wrapper */}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[800px]"> {/* Ensures table doesn't squish too much on mobile */}
            <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5 text-left">Date</th>
                <th className="px-6 py-5 text-left">Shop ID</th>
                <th className="px-6 py-5 text-left">Material</th>
                <th className="px-6 py-5 text-center">Qty</th>
                <th className="px-6 py-5 text-center">Cement</th>
                <th className="px-6 py-5 text-right">Staff Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedHistory.map((log) => (
                <tr key={log.production_id} className="group hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      <Calendar size={14} className="text-orange-500" />
                      {new Date(log.production_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 font-black text-[11px] text-slate-500 uppercase">
                      <Store size={14} className="text-slate-400" />
                      {log.office.office_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                      <Layers size={14} className="text-orange-500" />
                      {log.product.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-black">
                      {log.unit_produced}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {log.cementProduct ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs">
                          <HardHat size={12} className="text-orange-600" />
                          {log.cement_used}
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                          {log.cementProduct.product_name.split(' ')[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300 text-[10px] font-bold uppercase italic">None</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap justify-end gap-1 max-w-[150px] ml-auto">
                      {log.employees?.slice(0, 2).map((emp, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-gray-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <Users size={10} />
                          {emp.employee?.name.split(' ')[0]}
                        </span>
                      ))}
                      {log.employees.length > 2 && (
                        <span className="text-[9px] font-bold text-orange-500">+{log.employees.length - 2}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-4 md:px-8 py-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {filteredHistory.length} Logs Found
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white rounded-lg border border-gray-100 text-slate-400 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {idx > 0 && array[idx - 1] !== page - 1 && <span className="text-slate-300">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${currentPage === page
                            ? "bg-orange-600 text-white shadow-md"
                            : "bg-white text-slate-400 border border-gray-100"
                          }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white rounded-lg border border-gray-100 text-slate-400 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}