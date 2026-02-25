import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Download, FileText, Calendar,
  ChevronLeft, ChevronRight, Layout, ArrowUpRight, ArrowDownLeft, X
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
  }, [page]);

  // Handle Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchTransactions();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

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
    <div className="p-4 md:p-8 lg:p-10 bg-[#F8FAFC] min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Transactions</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">{totalItems} Total Records Found</p>
        </div>

        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 group"
        >
          <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
          Export Statement
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 flex items-center bg-slate-50 rounded-[2rem] px-6 py-3 w-full border border-transparent focus-within:border-indigo-100 focus-within:bg-white transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="ml-3 w-full bg-transparent outline-none text-sm font-bold text-slate-600 placeholder:text-slate-300"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-full w-full lg:w-auto overflow-x-auto no-scrollbar">
          {["all", "sent", "received"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-20 text-center border border-dashed border-slate-200"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-bold">No transactions found matching your criteria.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t, idx) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white p-2 pr-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6"
              >
                {/* Visual Type Indicator */}
                <div className={`w-full md:w-32 h-24 rounded-[1.5rem] flex flex-col items-center justify-center ${t.isSent ? "bg-rose-50 border border-rose-100" : "bg-emerald-50 border border-emerald-100"
                  }`}>
                  <span className={`text-[10px] font-black uppercase mb-1 ${t.isSent ? "text-rose-400" : "text-emerald-400"}`}>
                    {t.isSent ? "Outgoing" : "Incoming"}
                  </span>
                  <div className={`p-3 rounded-2xl ${t.isSent ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                    {t.isSent ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 w-full">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">
                      {t.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
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
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">{t.bankName}</p>
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
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-8 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Download size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Statement Export</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Select Date Range</p>
                  </div>
                </div>
                <button onClick={() => setIsExportOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> Start Date
                    </label>
                    <input
                      type="date"
                      value={exportDates.start}
                      onChange={(e) => setExportDates(p => ({ ...p, start: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> End Date
                    </label>
                    <input
                      type="date"
                      value={exportDates.end}
                      onChange={(e) => setExportDates(p => ({ ...p, end: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout size={12} /> Filter by Bank (Optional)
                  </label>
                  <select
                    value={exportBankId}
                    onChange={(e) => setExportBankId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="">All Banks / Cash</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name} - {bank.holderName}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl mt-1">
                    <Layout size={16} />
                  </div>
                  <p className="text-[10px] leading-relaxed font-bold text-indigo-400 uppercase">
                    This will generate a consolidated PDF statement of all financial activities between the selected dates. All wallet, material, service, and fuel records will be included.
                  </p>
                </div>
              </div>

              <div className="p-8 pt-0">
                <button
                  onClick={exportToPDF}
                  disabled={isGeneratingPDF}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
                >
                  {isGeneratingPDF ? "Generating Statement..." : <>
                    <Download size={18} /> Generate PDF
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
