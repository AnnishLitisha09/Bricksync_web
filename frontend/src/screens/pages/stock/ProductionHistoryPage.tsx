import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Calendar,
  Store,
  Users,
  Layers,
  HardHat,
  Trash2,
  AlertTriangle,
  X,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Eye,
  FileSpreadsheet
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getProductionHistory, deleteProductionLog } from "../../../api/inventory";
import toast from "react-hot-toast";
import { useStockStore } from "../../../store/useStockStore";
import ProductionEntryModal from "./ProductionEntryModal";

interface RawMaterialSnapshot {
  material_product_id?: number | null;
  material_name: string;
  unit: string;
  is_cement: boolean;
  standard_qty: number;
  actual_qty: number;
  qty_per_brick?: number;
  variance?: number;
  variance_status?: "HIGH" | "LOW" | "OPTIMAL";
}

interface ProductionLog {
  production_id: number;
  production_date: string;
  unit_produced: string;
  cement_used: string;
  number_of_stocks: string;
  price_per_stock: string;
  raw_materials_used?: RawMaterialSnapshot[];
  cementProduct?: {
    product_name: string;
  };
  product: {
    product_name: string;
    category?: string;
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
  const [selectedShopFilter, setSelectedShopFilter] = useState("all");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest_units">("newest");

  const [history, setHistory] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedDetailLog, setSelectedDetailLog] = useState<ProductionLog | null>(null);
  const itemsPerPage = 10;

  const { offices, fetchStockData } = useStockStore();
  const [productionModal, setProductionModal] = useState(false);

  useEffect(() => {
    fetchStockData();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getProductionHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load production logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Filter products list for the filter dropdown
  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      if (h.product?.product_name) set.add(h.product.product_name);
    });
    return Array.from(set);
  }, [history]);

  // Filtered & Sorted History
  const filteredHistory = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return history
      .filter((log) => {
        // Search Filter
        const query = search.toLowerCase();
        const matchesSearch =
          !query ||
          log.product?.product_name.toLowerCase().includes(query) ||
          log.office?.office_name.toLowerCase().includes(query) ||
          log.production_date.includes(query) ||
          log.employees?.some((e) => e.employee?.name.toLowerCase().includes(query));

        // Shop Filter
        const matchesShop =
          selectedShopFilter === "all" || log.office?.office_name === selectedShopFilter;

        // Product Filter
        const matchesProduct =
          selectedProductFilter === "all" || log.product?.product_name === selectedProductFilter;

        // Date Range Filter
        let matchesDate = true;
        const logDate = new Date(log.production_date);
        if (dateRangeFilter === "today") {
          matchesDate = log.production_date === todayStr;
        } else if (dateRangeFilter === "week") {
          matchesDate = logDate >= startOfWeek;
        } else if (dateRangeFilter === "month") {
          matchesDate = logDate >= startOfMonth;
        }

        return matchesSearch && matchesShop && matchesProduct && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.production_date).getTime() - new Date(a.production_date).getTime();
        } else if (sortBy === "oldest") {
          return new Date(a.production_date).getTime() - new Date(b.production_date).getTime();
        } else if (sortBy === "highest_units") {
          return (parseFloat(b.unit_produced) || 0) - (parseFloat(a.unit_produced) || 0);
        }
        return 0;
      });
  }, [history, search, selectedShopFilter, selectedProductFilter, dateRangeFilter, sortBy]);

  // Pagination
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedShopFilter, selectedProductFilter, dateRangeFilter, sortBy]);

  // Delete production log handler
  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteProductionLog(deleteId);
      toast.success("Production log deleted and stock reversed!");
      setHistory((prev) => prev.filter((log) => log.production_id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete production log");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("No production records to export");
      return;
    }

    const headers = [
      "Log ID",
      "Production Date",
      "Plant Location",
      "Brick Product",
      "Units Produced",
      "No. of Stocks",
      "Price Per Stock (Rs)",
      "Cement Bags Used",
      "Cement Product",
      "Assigned Operators",
      "Total Wage (Rs)"
    ];

    const rows = filteredHistory.map((log) => {
      const stocks = parseFloat(log.number_of_stocks) || 0;
      const price = parseFloat(log.price_per_stock) || 0;
      const totalWage = (stocks * price).toFixed(2);
      const staffNames = log.employees?.map((e) => e.employee?.name).join("; ") || "None";

      return [
        `#PROD-${log.production_id}`,
        log.production_date,
        `"${log.office?.office_name || ""}"`,
        `"${log.product?.product_name || ""}"`,
        log.unit_produced,
        stocks,
        price,
        log.cement_used,
        `"${log.cementProduct?.product_name || "OPC Cement"}"`,
        `"${staffNames}"`,
        totalWage
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `production_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported production history to CSV");
  };

  return (
    <div className="space-y-6 pb-12 animate-in font-sans">
      {/* 1. TOP COMMAND BAR & NAVIGATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="size-8 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center cursor-pointer shadow-2xs active:scale-95"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
              Manufacturing Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Production <span className="text-indigo-600">History</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Historical manufacturing records, material consumption logs & operator piece-rate wages
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => navigate("/production/mix-ratio")}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Configure Mix Ratios"
          >
            <FlaskConical size={14} className="text-indigo-600" />
            <span>Plant Mix Ratios</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Export filtered logs to CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setProductionModal(true)}
            className="h-10 px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>New Production</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & OPERATIONS CONTROL TOOLBAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xs border border-slate-200/80 space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search by brick product, plant yard, staff name, or date (YYYY-MM-DD)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Plant Location Filter */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={selectedShopFilter}
              onChange={(e) => setSelectedShopFilter(e.target.value)}
              className="w-full h-11 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl px-3.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="all">All Plant Locations</option>
              {offices.map((o) => (
                <option key={o.office_id} value={o.office_name}>
                  {o.office_name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full h-11 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl px-3.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="all">All Brick Products</option>
              {uniqueProducts.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full h-11 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl px-3.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all cursor-pointer shadow-2xs"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_units">Highest Production</option>
            </select>
          </div>
        </div>

        {/* Date Quick Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Time Range:</span>
            {(["all", "today", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRangeFilter(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                  dateRangeFilter === range
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60"
                }`}
              >
                {range === "all" ? "All Time" : range === "week" ? "This Week" : range === "month" ? "This Month" : "Today"}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-bold text-slate-400">
            Showing <span className="text-slate-800 font-black">{filteredHistory.length}</span> of {history.length} records
          </div>
        </div>
      </div>

      {/* 5. LOADING SPINNER */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="size-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading production logs...</p>
        </div>
      )}

      {/* 6. PRODUCTION LOGS TABLE */}
      {!loading && (
        <div className="bg-white rounded-3xl shadow-2xs border border-slate-200/80 overflow-hidden">
          {filteredHistory.length === 0 ? (
            /* Empty State */
            <div className="py-16 px-4 text-center space-y-4">
              <div className="size-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto shadow-2xs">
                <Layers size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800">No production logs found</h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  {search || selectedShopFilter !== "all" || selectedProductFilter !== "all" || dateRangeFilter !== "all"
                    ? "No manufacturing entries match your current search and filter criteria."
                    : "Start recording daily brick manufacturing logs to track finished output and cement consumption."}
                </p>
              </div>
              <button
                onClick={() => setProductionModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Log Production Entry</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[950px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Log / Date</th>
                    <th className="px-5 py-3.5">Plant Location</th>
                    <th className="px-5 py-3.5">Brick Product</th>
                    <th className="px-5 py-3.5 text-center">Volume Produced</th>
                    <th className="px-5 py-3.5 text-center">Cement Used</th>
                    <th className="px-5 py-3.5 text-center">Stock Details</th>
                    <th className="px-5 py-3.5 text-center">Labor Piece-Rate</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedHistory.map((log) => {
                    const stocks = parseFloat(log.number_of_stocks) || 0;
                    const unitsProduced = parseFloat(log.unit_produced) || 0;
                    const perStock = stocks > 0 ? unitsProduced / stocks : 0;
                    const perStockDisplay = Number.isInteger(perStock) ? perStock : perStock.toFixed(1);
                    const pricePerStock = parseFloat(log.price_per_stock) || 0;
                    const totalWage = stocks * pricePerStock;
                    const staffCount = log.employees?.length || 1;
                    const wagePerPerson = totalWage / staffCount;

                    return (
                      <tr
                        key={log.production_id}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        {/* 1. Date & Log ID */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                              <Calendar size={13} className="text-indigo-600" />
                              <span>
                                {new Date(log.production_date).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 block pl-4.5">
                              #PROD-{log.production_id}
                            </span>
                          </div>
                        </td>

                        {/* 2. Plant / Store */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                              <Store size={13} />
                            </div>
                            <span className="font-bold text-xs text-slate-800">
                              {log.office?.office_name || "Factory Main"}
                            </span>
                          </div>
                        </td>

                        {/* 3. Finished Brick Product */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Layers size={15} />
                            </div>
                            <div>
                              <div className="font-black text-xs uppercase text-slate-900 tracking-tight">
                                {log.product?.product_name}
                              </div>
                              {stocks > 0 && (
                                <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 mt-0.5">
                                  {stocks} Stocks {perStock > 0 ? `• ${perStockDisplay} per stock` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. Units Made */}
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100/90 rounded-xl font-black text-xs shadow-2xs whitespace-nowrap">
                              <span className="text-sm">{Number(log.unit_produced).toLocaleString("en-IN")}</span>
                              <span className="text-[10px] uppercase text-indigo-600 font-extrabold">Bricks</span>
                            </span>
                          </div>
                        </td>

                        {/* 5. Cement Used */}
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800">
                              <HardHat size={14} className="text-amber-500" />
                              <span>{log.cement_used} Bags</span>
                            </div>
                            {log.cementProduct && (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {log.cementProduct.product_name.split(" ")[0]}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Stock Details (Number of Stocks & Per Stock) */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {stocks > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-black">
                                {stocks} Stocks
                              </span>
                              {perStock > 0 && (
                                <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                                  {perStockDisplay} per stock
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">-</span>
                          )}
                        </td>

                        {/* 7. Operator Labor Wage Breakdown */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {log.employees && log.employees.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1">
                                {log.employees.slice(0, 3).map((emp, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700"
                                    title={`${emp.employee?.name}: ₹${wagePerPerson.toFixed(2)}`}
                                  >
                                    {emp.employee?.name.split(" ")[0]}
                                  </span>
                                ))}
                                {log.employees.length > 3 && (
                                  <span className="text-[9px] font-bold text-slate-400">
                                    +{log.employees.length - 3}
                                  </span>
                                )}
                              </div>
                              {totalWage > 0 && (
                                <span className="text-[10px] font-black text-emerald-700">
                                  ₹{totalWage.toFixed(2)} Total
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs font-semibold">Unassigned</span>
                          )}
                        </td>

                        {/* 8. Row Action Buttons */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailLog(log)}
                              className="size-8 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                              title="View Full Production Breakdown"
                            >
                              <Eye size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteId(log.production_id)}
                              className="size-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Delete log & reverse stock levels"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-400">
                Page <span className="text-slate-800 font-black">{currentPage}</span> of{" "}
                <span className="text-slate-800 font-black">{totalPages}</span> ({filteredHistory.length} total entries)
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="size-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft size={15} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((page, idx, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && array[idx - 1] !== page - 1 && (
                          <span className="text-slate-300 px-1 font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`size-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            currentPage === page
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                              : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="size-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. PRODUCTION LOG DETAIL DRAWER / MODAL */}
      {selectedDetailLog &&
        createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDetailLog(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10"
              >
                {/* Header */}
                <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                      <Layers size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          #PROD-{selectedDetailLog.production_id}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">
                          {selectedDetailLog.production_date}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight mt-0.5">
                        {selectedDetailLog.product?.product_name}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailLog(null)}
                    className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Details */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                  {/* Summary Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Volume Manufactured
                      </span>
                      <div className="text-xl font-black text-indigo-600">
                        {Number(selectedDetailLog.unit_produced).toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-bold text-slate-600">Bricks</span>
                      </div>
                      {(() => {
                        const mStocks = parseFloat(selectedDetailLog.number_of_stocks) || 0;
                        const mUnits = parseFloat(selectedDetailLog.unit_produced) || 0;
                        const mPer = mStocks > 0 ? mUnits / mStocks : 0;
                        const mPerDisplay = Number.isInteger(mPer) ? mPer : mPer.toFixed(1);
                        return (
                          <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                            {selectedDetailLog.number_of_stocks} Stocks {mPer > 0 ? `(${mPerDisplay} per stock)` : ""}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Cement Consumed
                      </span>
                      <div className="text-xl font-black text-amber-600">
                        {selectedDetailLog.cement_used}{" "}
                        <span className="text-xs font-bold text-slate-600">Bags</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                        {selectedDetailLog.cementProduct?.product_name || "OPC 53 Grade"}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Total Labor Wage
                      </span>
                      <div className="text-xl font-black text-emerald-600">
                        ₹
                        {(
                          (parseFloat(selectedDetailLog.number_of_stocks) || 0) *
                          (parseFloat(selectedDetailLog.price_per_stock) || 0)
                        ).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                        ₹{selectedDetailLog.price_per_stock} / stock
                      </span>
                    </div>
                  </div>

                  {/* Plant Location & Operators */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                        Assigned Operators ({selectedDetailLog.employees?.length || 0})
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Store size={13} /> {selectedDetailLog.office?.office_name}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDetailLog.employees?.map((emp, idx) => {
                        const total =
                          (parseFloat(selectedDetailLog.number_of_stocks) || 0) *
                          (parseFloat(selectedDetailLog.price_per_stock) || 0);
                        const count = selectedDetailLog.employees?.length || 1;
                        const perPerson = total / count;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                <Users size={12} />
                              </div>
                              <span className="text-xs font-bold text-slate-800">
                                {emp.employee?.name}
                              </span>
                            </div>
                            <span className="text-xs font-black text-emerald-600">
                              ₹{perPerson.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOM Materials Deductions Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 block">
                      Physical Stock Deductions (Plant BOM Snapshot)
                    </span>

                    {selectedDetailLog.raw_materials_used && selectedDetailLog.raw_materials_used.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                            <tr>
                              <th className="px-3.5 py-2.5">Material</th>
                              <th className="px-3.5 py-2.5 text-center">Actual Used</th>
                              <th className="px-3.5 py-2.5 text-center">Standard Ratio</th>
                              <th className="px-3.5 py-2.5 text-right">Variance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedDetailLog.raw_materials_used.map((mat, i) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="px-3.5 py-2 font-bold text-slate-800">
                                  {mat.material_name}
                                </td>
                                <td className="px-3.5 py-2 text-center font-black text-slate-900">
                                  {mat.actual_qty} {mat.unit}
                                </td>
                                <td className="px-3.5 py-2 text-center text-slate-500 font-semibold">
                                  {mat.standard_qty} {mat.unit}
                                </td>
                                <td className="px-3.5 py-2 text-right">
                                  {mat.variance !== undefined && mat.variance !== 0 ? (
                                    <span
                                      className={`font-black text-[11px] ${
                                        mat.variance > 0 ? "text-amber-600" : "text-blue-600"
                                      }`}
                                    >
                                      {mat.variance > 0 ? `+${mat.variance}` : mat.variance} {mat.unit}
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 font-black text-[11px]">Optimal</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                        No custom BOM ratio was recorded for this entry.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Entry verified by Manufacturing Supervisor
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailLog(null)}
                    className="h-9 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}

      {/* 8. PRODUCTION ENTRY MODAL */}
      <ProductionEntryModal
        isOpen={productionModal}
        onClose={() => setProductionModal(false)}
        onSuccess={loadHistory}
      />

      {/* 9. DELETE CONFIRMATION MODAL */}
      {deleteId &&
        createPortal(
          <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteId(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200/80 p-6 md:p-8 overflow-hidden z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-5">
                  <button
                    type="button"
                    onClick={() => setDeleteId(null)}
                    className="size-8 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="size-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 border border-red-100 shadow-2xs">
                    <AlertTriangle size={32} />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Reverse Production Log?</h3>
                    <p className="text-slate-500 font-semibold text-xs leading-relaxed px-2">
                      Are you sure you want to delete this log? This will automatically{" "}
                      <span className="text-red-600 font-bold">deduct the manufactured finished bricks</span> and{" "}
                      <span className="text-emerald-600 font-bold">restore the consumed cement & raw materials</span> back into physical stock.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteId(null)}
                      className="py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all border border-slate-200 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={loading}
                      className="py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          <Trash2 size={15} /> Delete & Reverse
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
