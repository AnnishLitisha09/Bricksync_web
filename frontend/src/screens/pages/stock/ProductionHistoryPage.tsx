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
    // .finally(() => setLoading(false));
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
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-orange-600 transition-all border border-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            Production <span className="text-orange-600">History</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Manufacturing Logs</p>
        </div>
        <div className="p-3 bg-white rounded-2xl shadow-sm text-orange-600 border border-gray-100">
          <Filter size={20} />
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-4xl shadow-sm border border-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by material, shop, or staff name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-6 text-left">Date</th>
                <th className="px-6 py-6 text-left">Shop ID</th>
                <th className="px-6 py-6 text-left">Material</th>
                <th className="px-6 py-6 text-center">Qty</th>
                <th className="px-6 py-6 text-center">Cement (Bags)</th>
                <th className="px-6 py-6 text-right">Staff Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedHistory.map((log) => (
                <tr key={log.production_id} className="group hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                      <Calendar size={14} className="text-orange-500" />
                      {new Date(log.production_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="flex items-center gap-1.5 font-black text-[11px] text-slate-500 uppercase">
                      <Store size={14} className="text-slate-400" />
                      {log.office.office_name}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-800 text-sm uppercase flex items-center gap-2">
                      <Layers size={14} className="text-orange-500" />
                      {log.product.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-black">
                      {log.unit_produced}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {log.cementProduct ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-black text-xs">
                          <HardHat size={14} className="text-orange-600" />
                          {log.cement_used} Bags
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {log.cementProduct.product_name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">None</div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {log.employees?.map((emp, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-gray-100 text-[10px] font-bold text-slate-500 px-2 py-1 rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <Users size={10} />
                          {emp.employee?.name}

                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50/50 px-8 py-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white rounded-xl border border-gray-100 text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === page
                      ? "bg-slate-900 text-white shadow-lg"
                      : "bg-white text-slate-400 border border-gray-100 hover:border-orange-500 hover:text-orange-600 shadow-sm"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white rounded-xl border border-gray-100 text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}