import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Download, FileText, Calendar,
  ChevronLeft, ChevronRight, Layout, ArrowUpRight, ArrowDownLeft, X,
  ArrowRight
} from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import { useBankStore } from "../../../store/bankStore";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface Transaction {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number | string;
  isSent: boolean;
  bankName: string;
  type: string;
  description: string;
}

const formatToRupees = (amount: string | number) => {
  const numericValue = typeof amount === "string" ? amount.replace(/[$,₹]/g, "") : amount.toString();
  const value = numericValue.replace(/[+-]/g, "");
  return `₹${Number(value).toLocaleString("en-IN")}`;
};

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "received">("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportDates, setExportDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [exportBankId, setExportBankId] = useState("");
  const { banks, fetchBanks } = useBankStore();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [analytics, setAnalytics] = useState({ todayIncome: 0, todayExpenses: 0 });

  const loadStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/analytics/today-summary`, { headers: getAuthHeader() });
      const data = await res.json();
      if (data.success) {
        setAnalytics({ todayIncome: data.todayIncome, todayExpenses: data.todayExpenses });
      }
    } catch (error) {
      console.error("Failed to fetch treasury stats", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/wallet/all-transactions?page=${page}&limit=${limit}&search=${searchText}`, {
        headers: getAuthHeader(),
      });
      const result = await res.json();
      if (result.success) {
        setTransactions(result.data);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages);
          setTotalItems(result.pagination.total);
        }
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBanks();
    loadStats();
  }, [page]);

  // Handle Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchTransactions();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);
  // Handle Pagination Centering
  useEffect(() => {
    const activeBtn = document.getElementById(`page-btn-${page}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [page, totalPages]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      let matchesStatus = true;
      if (statusFilter === "sent") matchesStatus = t.isSent === true;
      if (statusFilter === "received") matchesStatus = t.isSent === false;

      return matchesStatus;
    });
  }, [transactions, statusFilter]);

  const exportToPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const res = await fetch(`${BASE_URL}/wallet/all-transactions?startDate=${exportDates.start}&endDate=${exportDates.end}&bankId=${exportBankId}&search=${searchText}&limit=1000`, {
        headers: getAuthHeader(),
      });
      const result = await res.json();

      if (!result.success || !result.data.length) {
        alert("No transactions found for the selected date range.");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // --- COMPANY DATA (Mirroring BusinessNotepad) ---
      const company = {
        title: "ASWATH HOLLOW BRICKS",
        subtitle: "& LORRY SERVICES",
        address: "SS Tower, Pandian Nagar Bus Stop,\nPN Road, Tiruppur - 641602",
        phone: "+91 98420 48181, 98430 83521",
        email: "bricksync001@gmail.com",
        website: "www.aswath.online",
        signature: "M. BALAMANI"
      };

      // --- 1. HEADER ACCENT ---
      doc.setFillColor(248, 250, 252);
      doc.circle(pageWidth, 0, 80, 'F');

      // --- 2. MAIN HEADER ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text(company.title, 14, 22);
      doc.setFontSize(18);
      doc.text(company.subtitle, 14, 30);

      // Address
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate-400
      doc.text(company.address, 14, 38);

      // Contact Box (Right Side)
      const contactX = pageWidth - 70;
      doc.setFillColor(15, 23, 42); // slate-900 (BusinessNotepad style)
      doc.roundedRect(contactX, 15, 56, 18, 4, 4, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("CONTACT SUPPORT", contactX + 5, 21);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(company.phone, contactX + 5, 28);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(company.email, pageWidth - 14, 38, { align: "right" });
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.setFont("helvetica", "bold");
      doc.text(company.website, pageWidth - 14, 43, { align: "right" });

      // --- 3. STATEMENT OVERVIEW ---
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(14, 55, pageWidth - 14, 55);

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text("FINANCIAL STATEMENT", 14, 65);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`REPORTING PERIOD: ${exportDates.start} TO ${exportDates.end}`, 14, 70);

      // --- 4. SUMMARY BOXES ---
      const totalIn = result.data.reduce((acc: number, t: any) => !t.isSent ? acc + Number(t.amount) : acc, 0);
      const totalOut = result.data.reduce((acc: number, t: any) => t.isSent ? acc + Number(t.amount) : acc, 0);

      const boxWidth = (pageWidth - 34) / 2;
      const startYSum = 78;

      // BOX 1: TOTAL CREDITED
      doc.setFillColor(240, 253, 244); // Emerald-50
      doc.roundedRect(14, startYSum, boxWidth, 20, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setTextColor(21, 128, 61); // Emerald-700
      doc.text("TOTAL CREDITED", 18, startYSum + 7);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${totalIn.toLocaleString()}`, 18, startYSum + 15);

      // BOX 2: TOTAL DEBITED
      doc.setFillColor(254, 242, 242); // Rose-50
      doc.roundedRect(14 + boxWidth + 6, startYSum, boxWidth, 20, 3, 3, 'F');
      doc.setFontSize(7);
      doc.setTextColor(185, 28, 28); // Rose-700
      doc.text("TOTAL DEBITED", 18 + boxWidth + 6, startYSum + 7);
      doc.setFontSize(12);
      doc.text(`Rs. ${totalOut.toLocaleString()}`, 18 + boxWidth + 6, startYSum + 15);

      // --- 5. TRANSACTION TABLE ---
      const tableData = result.data.map((t: Transaction, idx: number) => [
        (idx + 1).toString().padStart(2, '0'),
        new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        t.name.toUpperCase(),
        t.bankName || "CASH",
        t.category,
        `Rs. ${Number(t.amount).toLocaleString()}`
      ]);

      autoTable(doc, {
        head: [['ID', 'DATE', 'ENTITY / DESCRIPTION', 'BANK', 'CATEGORY', 'AMOUNT']],
        body: tableData,
        startY: 105,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 4
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          textColor: [71, 85, 105],
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { fontStyle: 'bold', textColor: [30, 41, 59] },
          5: { halign: 'right', fontStyle: 'bold' }
        },
        willDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const tx = result.data[data.row.index];
            if (tx.isSent) {
              doc.setTextColor(185, 28, 28); // Red for Debits
            } else {
              doc.setTextColor(21, 128, 61); // Green for Credits
            }
          }
        },
        alternateRowStyles: { fillColor: [250, 251, 253] }
      });

      // --- 6. FOOTER & SIGNATURE ---
      const footerY = doc.internal.pageSize.getHeight() - 40;

      // Signature Area
      const sigX = pageWidth - 70;
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.5);
      doc.line(sigX, footerY, pageWidth - 14, footerY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(company.signature, sigX + 28, footerY + 8, { align: "center" });

      doc.setFontSize(7);
      doc.setTextColor(79, 70, 229);
      doc.text("AUTHORIZED SIGNATORY", sigX + 28, footerY + 12, { align: "center" });

      // Disclaimer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("This is an electronically generated statement for Bricksync Enterprise. All transactions are subject to verification.", pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });

      doc.save(`Statement_${exportDates.start}_${exportDates.end}.pdf`);
      setIsExportOpen(false);
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-slate-400 text-xs font-semibold">{totalItems} Total Records Processed</p>
        </div>

        <button
          onClick={() => setIsExportOpen(true)}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95 group shrink-0"
        >
          <Download size={15} className="group-hover:translate-y-0.5 transition-transform" />
          <span>Export Statement</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-slate-200/80 flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex items-center gap-4">
            <div className="size-11 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Today's Income</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight">₹{analytics.todayIncome.toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-4 sm:p-5 rounded-2xl shadow-2xs border border-slate-200/80 flex items-center justify-between group overflow-hidden relative"
        >
          <div className="flex items-center gap-4">
            <div className="size-11 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-0.5">Today's Expenses</p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight">₹{analytics.todayExpenses.toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-2.5 rounded-2xl shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0">
          {["all", "sent", "received"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${statusFilter === status
                ? "bg-white text-indigo-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syncing Records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-200"
          >
            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <FileText size={26} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm">No transactions found matching your criteria.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t, idx) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                className="group bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col sm:flex-row items-center gap-4"
              >
                {/* Visual Type Indicator */}
                <div className={`w-full sm:w-28 h-16 rounded-xl flex items-center justify-center gap-2.5 px-3 shrink-0 ${t.isSent ? "bg-rose-50 border border-rose-100 text-rose-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"
                  }`}>
                  <div className={`p-2 rounded-lg ${t.isSent ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                    {t.isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider">
                    {t.isSent ? "Out" : "In"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 w-full">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      {t.isSent ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md tracking-widest">{t.bankName}</span>
                          <ArrowRight size={14} className="text-slate-300" />
                          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{t.name}</h3>
                          <ArrowRight size={14} className="text-slate-300" />
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded-md tracking-widest">{t.bankName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md border border-slate-200 tracking-widest">
                        {t.type}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[8px] font-black uppercase rounded-md border border-indigo-100 tracking-widest">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium">
                        {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <span className={`text-2xl font-black tracking-tighter ${t.isSent ? "text-rose-600" : "text-emerald-600"}`}>
                        {t.isSent ? "-" : "+"} {formatToRupees(t.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center gap-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
          </p>

          <div className="flex items-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>

            <div
              id="pagination-container"
              className="flex items-center gap-2 max-w-[250px] md:max-w-[400px] overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
            >
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    id={`page-btn-${pageNum}`}
                    onClick={() => {
                      setPage(pageNum);
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === pageNum
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80"
            >
              {/* Modal Header */}
              <div className="p-6 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                    <Download size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Statement Export</h3>
                    <p className="text-slate-400 text-xs font-semibold">Select Date Range</p>
                  </div>
                </div>
                <button onClick={() => setIsExportOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} /> Start Date
                    </label>
                    <input
                      type="date"
                      value={exportDates.start}
                      onChange={(e) => setExportDates(p => ({ ...p, start: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={12} /> End Date
                    </label>
                    <input
                      type="date"
                      value={exportDates.end}
                      onChange={(e) => setExportDates(p => ({ ...p, end: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layout size={12} /> Filter by Bank (Optional)
                  </label>
                  <select
                    value={exportBankId}
                    onChange={(e) => setExportBankId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">All Banks / Cash</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                    <Layout size={14} />
                  </div>
                  <p className="text-[11px] leading-relaxed font-semibold text-indigo-700">
                    This will generate a consolidated PDF statement of all financial activities between the selected dates. All wallet, material, service, and fuel records will be included.
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={exportToPDF}
                  disabled={isGeneratingPDF}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isGeneratingPDF ? "Generating Statement..." : <>
                    <Download size={16} /> <span>Generate Statement PDF</span>
                  </>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionsPage;
