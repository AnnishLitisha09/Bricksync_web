import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier: any;
    allLogs: any[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, supplier, allLogs }) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF({
                compress: true // Enable compression for smaller file size
            });
            const pageWidth = doc.internal.pageSize.width;

            // --- BRANDING ---
            const companyName = "ASWATH HOLLOW BRICKS";

            // Smooth Header with rounded bottom-right corner (Sleek Modern Feel)
            doc.setFillColor(30, 41, 59); // Slate-900
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Header Text
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text(companyName, 14, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 200, 200);
            doc.text("Premium Quality Bricks & Building Materials", 14, 32);

            // Report Title
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text("MATERIAL LEDGER REPORT", pageWidth / 2, 55, { align: "center" });

            // Period Info
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            if (startDate && endDate) {
                doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, pageWidth / 2, 62, { align: "center" });
            } else {
                doc.text(`Full Transaction History`, pageWidth / 2, 62, { align: "center" });
            }

            // --- INFO CARD (Proprietor Detail) ---
            doc.setFillColor(248, 250, 252); // Slate-50
            doc.setDrawColor(226, 232, 240); // Slate-200
            (doc as any).roundedRect(14, 75, pageWidth - 28, 28, 3, 3, 'FD');

            // Left Side Info
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "bold");
            doc.text("Proprietor Detail", 20, 83);

            doc.setTextColor(30, 41, 59);
            doc.text(supplier.owner_name, 20, 90);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text(`Phone: ${supplier.phone_no}`, 20, 96);

            // Right Side Info (Financials)
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text("Ledger Information", pageWidth - 85, 83);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text("Supplier:", pageWidth - 85, 90);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 59);
            doc.text(supplier.shop_name, pageWidth - 20, 90, { align: "right" });

            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text("Generated On:", pageWidth - 85, 96);
            doc.text(new Date().toLocaleDateString(), pageWidth - 20, 96, { align: "right" });

            // Filter Logs
            const startTs = startDate ? new Date(startDate).getTime() : 0;
            const endTs = endDate ? new Date(endDate).getTime() : Infinity;
            const reportLogs = allLogs
                .filter(l => l.sortDate >= startTs && l.sortDate <= endTs)
                .sort((a, b) => a.sortDate - b.sortDate);

            // --- TABLE ---
            const tableColumn = ["DATE", "VEHICLE NO", "MATERIAL", "UNIT", "RATE (₹)", "BILL AMT (₹)"];
            const tableRows: any[] = [];
            let totalBillAmount = 0;

            reportLogs.forEach((log: any) => {
                if (log.type === "ENTRY") {
                    const units = Number(log.units) || 0;
                    const amt = Number(log.amount) || 0;
                    const rate = units > 0 ? (amt / units).toFixed(2) : "0.00";
                    totalBillAmount += amt;

                    const vehicleNo = log.fields?.find((f: any) => f.field_name.toLowerCase().includes("vehicle"))?.field_value || "—";

                    tableRows.push([
                        new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        vehicleNo,
                        log.product?.product_name || "Material",
                        units,
                        rate,
                        amt.toLocaleString('en-IN')
                    ]);
                }
            });

            autoTable(doc, {
                startY: 115,
                head: [tableColumn],
                body: tableRows,
                theme: "plain",
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: "bold",
                    halign: "center",
                    cellPadding: 4
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [51, 65, 85],
                    halign: "center",
                    cellPadding: 4
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { left: 14, right: 14 },
            });

            // Simple Summary Card
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFillColor(30, 41, 59);
            (doc as any).roundedRect(pageWidth - 95, finalY, 81, 20, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text("Total Bill Amount", pageWidth - 85, finalY + 13);
            doc.text(`₹${totalBillAmount.toLocaleString('en-IN')}`, pageWidth - 20, finalY + 13, { align: "right" });

            doc.save(`${supplier.shop_name}_Report.pdf`);
            onClose();
        } catch (err) {
            console.error("PDF Export Error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-800">Export Ledger</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                disabled={isExporting}
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-l-2 border-indigo-500 pl-3">
                            Select date range for the branded PDF report
                        </p>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    disabled={isExporting}
                                    className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {isExporting ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                                            Generate PDF
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ExportModal;
