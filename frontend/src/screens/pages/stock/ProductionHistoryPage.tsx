import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Calendar,
  Store,
  Users,
  Layers,
  HardHat,
  Filter
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductionHistory } from "../../../api/inventory";

interface ProductionLog {
  production_id: number;
  production_date: string;
  unit_produced: string;
  cement_used: string;
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
  // const [loading, setLoading] = useState(true);

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
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by material, shop, or staff name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
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
              {filteredHistory.map((log) => (
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
                    <div className="flex items-center justify-center gap-1.5 text-slate-700 font-black text-xs">
                      <HardHat size={14} className="text-orange-600" />
                      {log.cement_used}
                    </div>
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

        {/* EMPTY STATE */}
        {filteredHistory.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No production logs found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}