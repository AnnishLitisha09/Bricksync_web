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
  Trash2,
  AlertTriangle,
  X,
  Plus,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getProductionHistory, deleteProductionLog } from "../../../api/inventory";
import toast from "react-hot-toast";
import { useStockStore } from "../../../store/useStockStore";

interface ProductionLog {
  production_id: number;
  production_date: string;
  unit_produced: string;
  cement_used: string;
  number_of_stocks: string;
  price_per_stock: string;
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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { stock, offices, employees: staffList, logProduction, fetchStockData } = useStockStore();
  const [productionModal, setProductionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productionForm, setProductionForm] = useState({
    shopId: "",
    productId: "",
    qty: "",
    cementProductId: "",
    cementBags: "",
    number_of_stocks: "",
    price_per_stock: "",
    date: new Date().toISOString().split('T')[0],
    selectedStaffIds: [] as number[]
  });

  useEffect(() => {
    fetchStockData();
  }, []);

  useEffect(() => {
    setLoading(true);
    getProductionHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const weeklyEarnings = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    const earnings: Record<string, number> = {};

    history.forEach(log => {
      const logDate = new Date(log.production_date);
      if (logDate >= startOfWeek && logDate <= endOfWeek) {
        const total = parseFloat(log.number_of_stocks || "0") * parseFloat(log.price_per_stock || "0");
        const count = log.employees?.length || 1;
        const perPerson = total / count;

        log.employees?.forEach(e => {
          const name = e.employee?.name || "Unknown";
          earnings[name] = (earnings[name] || 0) + perPerson;
        });
      }
    });

    return Object.entries(earnings)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [history]);

  const productionProducts = useMemo(() => {
    return stock.filter(p => p.office_id === Number(productionForm.shopId));
  }, [productionForm.shopId, stock]);

  const cementProducts = useMemo(() => {
    return stock
      .filter(p => p.office_id === Number(productionForm.shopId) && p.product.category === "cement")
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product.product_name
      }));
  }, [productionForm.shopId, stock]);

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !productionForm.selectedStaffIds.includes(id)) {
      setProductionForm({
        ...productionForm,
        selectedStaffIds: [...productionForm.selectedStaffIds, id]
      });
    }
  };

  const removeStaff = (id: number) => {
    setProductionForm({
      ...productionForm,
      selectedStaffIds: productionForm.selectedStaffIds.filter(s => s !== id)
    });
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productionForm.selectedStaffIds.length === 0) {
      toast.error("Please assign at least one staff member.");
      return;
    }

    const qtyNum = parseFloat(productionForm.qty);
    const cementBagsNum = parseFloat(productionForm.cementBags);
    const stocksNum = parseFloat(productionForm.number_of_stocks);
    const priceNum = parseFloat(productionForm.price_per_stock);

    if (isNaN(qtyNum) || qtyNum <= 0) { toast.error("Units produced must be a positive number."); return; }
    if (isNaN(cementBagsNum) || cementBagsNum < 0) { toast.error("Cement bags used cannot be negative."); return; }
    if (isNaN(stocksNum) || stocksNum < 0) { toast.error("Number of stocks cannot be negative."); return; }
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Price per stock cannot be negative."); return; }

    const payload = {
      office_id: Number(productionForm.shopId),
      product_id: Number(productionForm.productId),
      unit_produced: qtyNum,
      cement_used: cementBagsNum,
      cement_product_id: Number(productionForm.cementProductId),
      production_date: productionForm.date,
      employee_ids: productionForm.selectedStaffIds,
      number_of_stocks: stocksNum,
      price_per_stock: priceNum
    };

    try {
      setSubmitting(true);
      await logProduction(payload);
      getProductionHistory().then(setHistory);
      toast.success("Production record saved!");
      setProductionModal(false);
      setProductionForm({ shopId: "", productId: "", qty: "", cementProductId: "", cementBags: "", number_of_stocks: "", price_per_stock: "", date: new Date().toISOString().split('T')[0], selectedStaffIds: [] });
    } catch (err) {
      toast.error("Failed to log production.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteProductionLog(deleteId);
      toast.success("Production deleted and stock reversed");
      setHistory(prev => prev.filter(log => log.production_id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete production log");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProductionModal(true)}
            className="p-2 md:p-3 bg-slate-900 rounded-xl md:rounded-2xl shadow-sm text-white hover:bg-orange-600 transition-all border border-slate-800 flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">New Entry</span>
          </button>
          <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm text-orange-600 border border-gray-100">
            <Filter size={18} />
          </div>
        </div>
      </div>

      {/* WEEKLY EARNINGS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        {weeklyEarnings.length > 0 ? (
          weeklyEarnings.slice(0, 5).map((staff, idx) => (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Users size={14} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{staff.name}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">This Week</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">₹{staff.amount.toLocaleString()}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No earnings data for this week</p>
          </div>
        )}
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

      {/* LOADING STATE */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm animate-pulse">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bridging Logs...</p>
        </div>
      )}

      {/* TABLE CONTAINER */}
      <div className={`bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
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
                <th className="px-6 py-5 text-center">Earnings/Person</th>
                <th className="px-6 py-5 text-center">Staff Assigned</th>
                <th className="px-6 py-5 text-right">Actions</th>
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
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1 w-full max-w-[200px] mx-auto">
                      {(() => {
                        const totalAmount = parseFloat(log.number_of_stocks || "0") * parseFloat(log.price_per_stock || "0");
                        const empCount = log.employees?.length || 1;
                        const perPerson = totalAmount / empCount;
                        return log.employees?.map((emp, idx) => (
                          <div key={idx} className="text-[10px] font-bold text-slate-600 uppercase flex justify-between w-full border-b border-gray-100 pb-1 last:border-0">
                            <span>{emp.employee?.name.split(' ')[0]}</span>
                            <span className="text-orange-600">₹{perPerson.toFixed(2)}</span>
                          </div>
                        )) || <span className="text-slate-300">N/A</span>;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap justify-end gap-1 ml-auto">
                      {log.employees?.map((emp, idx) => (
                        <span
                          key={idx}
                          className="bg-white border border-gray-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <Users size={10} />
                          {emp.employee?.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteId(log.production_id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
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
      {/* PRODUCTION ENTRY MODAL */}
      <AnimatePresence>
        {productionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <Calendar size={24} />
                </div>
                <button onClick={() => setProductionModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Production <span className="text-orange-600">Entry</span></h3>
              <p className="text-slate-500 text-[10px] font-bold mb-4 uppercase tracking-widest">Daily Log for manufacturing units</p>

              <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Production Date</label>
                  <input
                    type="date"
                    value={productionForm.date}
                    onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                    className="bg-transparent text-sm font-black text-slate-700 outline-none border-b-2 border-orange-200 focus:border-orange-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm text-orange-600">
                  <Calendar size={20} />
                </div>
              </div>

              <form onSubmit={handleProductionSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">1. Store</label>
                    <select
                      required
                      value={productionForm.shopId}
                      onChange={(e) => setProductionForm({ ...productionForm, shopId: e.target.value, productId: "" })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Shop</option>
                      {offices.map(o => (
                        <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">2. Units Produced</label>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={productionForm.qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setProductionForm({ ...productionForm, qty: val });
                        }
                      }}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">3. Material</label>
                    <select
                      required
                      disabled={!productionForm.shopId}
                      value={productionForm.productId}
                      onChange={(e) => setProductionForm({ ...productionForm, productId: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    >
                      <option value="">{productionForm.shopId ? "Choose Item" : "Select Store"}</option>
                      {productionProducts
                        .filter(p => p.product.category === "bricks")
                        .map(p => (
                          <option key={p.stock_id} value={p.product_id}>{p.product.product_name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">4. Cement Type</label>
                    <select
                      required
                      disabled={!productionForm.shopId}
                      value={productionForm.cementProductId}
                      onChange={(e) => setProductionForm({ ...productionForm, cementProductId: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    >
                      <option value="">{productionForm.shopId ? "Select Cement" : "Select Store"}</option>
                      {cementProducts.map(p => (
                        <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center ml-1 mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">5. Cement Bags</label>
                    </div>
                    <div className="relative">
                      <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        required
                        type="text"
                        inputMode="decimal"
                        placeholder="Qty Used"
                        value={productionForm.cementBags}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*\.?\d*$/.test(val)) {
                            setProductionForm({ ...productionForm, cementBags: val });
                          }
                        }}
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">6. Assign Staff</label>
                    <select
                      onChange={handleStaffSelect}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Staff Members</option>
                      {staffList.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* STAFF SELECTED LIST */}
                <div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    {productionForm.selectedStaffIds.length === 0 && (
                      <span className="text-[10px] text-red-400 font-black uppercase p-2">* Select at least one staff member</span>
                    )}
                    {productionForm.selectedStaffIds.map(id => {
                      const staff = staffList.find(s => s.employee_id === id);
                      return (
                        <motion.span
                          layout
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          key={id}
                          className="flex items-center gap-1.5 bg-white border border-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm"
                        >
                          <Users size={12} className="text-orange-500" />
                          {staff?.employee_name}
                          <button type="button" onClick={() => removeStaff(id)} className="hover:text-red-500 ml-1">
                            <X size={14} />
                          </button>
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">7. No. of Stocks</label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={productionForm.number_of_stocks}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) {
                          setProductionForm({ ...productionForm, number_of_stocks: val });
                        }
                      }}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">8. Price Per Stock</label>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={productionForm.price_per_stock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setProductionForm({ ...productionForm, price_per_stock: val });
                        }
                      }}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Daily Record</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setDeleteId(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 animate-pulse">
                  <AlertTriangle size={40} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Reverse Logs?</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                    Are you sure you want to delete this production log? This action will <span className="text-red-500">reverse the stock levels</span> immediately.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all border border-slate-100 text-xs uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-200 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} /> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}