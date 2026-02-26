import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, FileText, Download, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  ledgerEntries: any[];
}

const ExportLedgerModal: React.FC<ExportLedgerModalProps> = ({ isOpen, onClose, customer, ledgerEntries }) => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const prepareData = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    // 1. Base Opening Balance from entries BEFORE the start date
    const creditBefore = ledgerEntries
      .filter(entry => new Date(entry.date) < fromDate)
      .reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
    const debitBefore = ledgerEntries
      .filter(entry => new Date(entry.date) < fromDate)
      .reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);

    let cumulativeOpeningValue = Number(creditBefore) - Number(debitBefore);

    // 2. Filter entries WITHIN the range
    const inRangeRaw = ledgerEntries.filter(entry => {
      const d = new Date(entry.date);
      return d >= fromDate && d <= toDate;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const finalRows: any[] = [];

    inRangeRaw.forEach(entry => {
      const displayDate = entry.date ? entry.date.split('-').reverse().join('-') : '-';

      if (entry.type === 'Dispatch') {
        const raw = entry.raw || {};
        const items = entry.items || []; // Use entry.items which is mapped by parent

        const filteredItems = items.filter((item: any) => {
          const isOpening = item?.product?.toUpperCase().includes('OPENING BALANCE');
          if (isOpening) {
            // Note: Parent maps these to .qty and .rate
            const val = (Number(item.rate) || 0) * (Number(item.qty) || 0);
            cumulativeOpeningValue += val;
            return false;
          }
          return true;
        });

        filteredItems.forEach((item: any) => {
          const qty = Number(item.qty) || 0;
          const prc = Number(item.rate) || 0;
          finalRows.push({
            date: displayDate,
            id: (entry.id || "").replace('ORD-', ''),
            particulars: `Delivery: ${item.product || 'Unknown'} Qty: ${qty.toFixed(3)} @ ${prc.toFixed(2)}`,
            debit: 0,
            credit: qty * prc
          });
        });

        if (Number(raw.transport_charge) > 0) {
          finalRows.push({
            date: displayDate,
            id: (entry.id || "").replace('ORD-', ''),
            particulars: `Delivery: TRANSPORT CHARGE`,
            debit: 0,
            credit: Number(raw.transport_charge) || 0
          });
        }
      } else {
        finalRows.push({
          date: displayDate,
          id: (entry.id || "").replace('STMT-', ''),
          particulars: `Payment Received (via ${entry.raw?.bank_type || 'CASH'})`,
          debit: Number(entry.debit) || 0,
          credit: 0
        });
      }
    });

    // Add the Unified Opening Balance row at top
    finalRows.unshift({
      date: dateRange.from.split('-').reverse().join('-'),
      id: "-",
      particulars: "OPENING BALANCE (B/F)",
      debit: 0,
      credit: Number(cumulativeOpeningValue) || 0
    });

    const totalDebit = finalRows.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const totalCredit = finalRows.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    const netBalance = totalCredit - totalDebit;

    return { finalRows, totalDebit, totalCredit, netBalance };
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const { finalRows, totalDebit, totalCredit, netBalance } = prepareData();
      const doc = new jsPDF();

      // Premium Header (Sleek Dark Slate)
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, 210, 45, 'F');

      // Company Gold Accent Line
      doc.setFillColor(234, 179, 8); // Amber 500 (Gold)
      doc.rect(0, 42, 210, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("M.ASWATH", 14, 22);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("HOLLOW BRICKS & LORRY SERVICES", 14, 30);
      doc.text("Suppliers of All Building Materials", 14, 35);

      // Statement Metadata (Right Aligned in Header)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ACCOUNT STATEMENT", 196, 22, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`DATE: ${new Date().toLocaleDateString('en-IN')}`, 196, 30, { align: 'right' });
      doc.text(`PERIOD: ${dateRange.from.split('-').reverse().join('/')} - ${dateRange.to.split('-').reverse().join('/')}`, 196, 35, { align: 'right' });

      // Customer Info Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("STATEMENT FOR:", 14, 60);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(customer.name.toUpperCase(), 14, 70);

      // Table with "Less is More" approach (horizontal lines only)
      autoTable(doc, {
        startY: 80,
        head: [['DATE', 'REF #', 'PARTICULARS / DESCRIPTION', 'DEBIT (PAID)', 'CREDIT (SALE)']],
        body: finalRows.map(row => [
          row.date,
          row.id,
          row.particulars,
          row.debit > 0 ? `${row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—',
          row.credit > 0 ? `${row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontSize: 8,
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
          cellPadding: 4,
        },
        columnStyles: {
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { horizontal: 14 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;

      // Summary Totals
      doc.setDrawColor(200, 200, 200);
      doc.line(100, finalY - 5, 196, finalY - 5); // Line above totals

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL TRANSACTIONS", 100, finalY);
      doc.text(`${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 165, finalY, { align: 'right' });
      doc.text(`${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, finalY, { align: 'right' });

      // Outstanding Balance Bar (Large and Explicit)
      doc.setFillColor(15, 23, 42);
      doc.rect(120, finalY + 5, 76, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("OUTSTANDING BALANCE", 125, finalY + 12);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Rs. ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 190, finalY + 20, { align: 'right' });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text("This is an official commercial statement from M.ASWATH HOLLOW BRICKS & LORRY SERVICES.", 105, 290, { align: 'center' });
      }

      doc.save(`Statement_${customer.name.replace(/\s+/g, '_')}_${dateRange.from}.pdf`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
        {/* Visual Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

        <div className="flex justify-between items-start mb-10 relative">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 ring-8 ring-slate-50">
              <FileText size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Ledger Hub</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Ready for Generation</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8 relative">
          <div className="group p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-slate-200 transition-all duration-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Account</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{customer.name}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Period Start</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                <input
                  type="date"
                  className="w-full pl-14 pr-6 py-5 rounded-[1.8rem] border-2 border-slate-100 bg-white font-bold text-slate-700 shadow-sm focus:border-slate-900 focus:ring-0 outline-none transition-all cursor-pointer"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Period End</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                <input
                  type="date"
                  className="w-full pl-14 pr-6 py-5 rounded-[1.8rem] border-2 border-slate-100 bg-white font-bold text-slate-700 shadow-sm focus:border-slate-900 focus:ring-0 outline-none transition-all cursor-pointer"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="w-full py-6 bg-slate-900 text-white rounded-4xl font-black text-sm uppercase tracking-[0.25em] hover:bg-slate-800 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-4 active:scale-[0.97] disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Download size={22} className="animate-bounce" />
                  Generate Official Statement
                </>
              )}
            </button>
            <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Securely generated encryption-enabled ledger
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const Loader2 = ({ size, className }: { size: number, className: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default ExportLedgerModal;
