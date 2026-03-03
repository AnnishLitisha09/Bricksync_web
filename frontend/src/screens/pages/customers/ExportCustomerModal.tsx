import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Download, Loader2, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "../../../utils/formatDate";
import { BASE_URL, getAuthHeader } from "../../../api/base";

interface ExportCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportCustomerModal: React.FC<ExportCustomerModalProps> = ({ isOpen, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;

    const fetchAllCustomers = async () => {
        try {
            // Fetch all customers without pagination limit (or a very high limit)
            const res = await fetch(
                `${BASE_URL}/customers?limit=10000`,
                { headers: { ...getAuthHeader() } }
            );
            if (!res.ok) throw new Error("Failed to fetch customers for export");
            const data = await res.json();
            return data.data || [];
        } catch (error) {
            console.error("Error fetching all customers:", error);
            return [];
        }
    };

    const handleDownloadPDF = async () => {
        setIsGenerating(true);
        try {
            const allCustomers = await fetchAllCustomers();
            if (allCustomers.length === 0) {
                alert("No customers found to export.");
                return;
            }

            const doc = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            // Premium Header (Sleek Dark Slate)
            doc.setFillColor(15, 23, 42); // Slate 900
            doc.rect(0, 0, 297, 45, 'F'); // Landscape width is 297mm

            // Company Gold Accent Line
            doc.setFillColor(234, 179, 8); // Amber 500 (Gold)
            doc.rect(0, 42, 297, 3, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("M.ASWATH HOLLOW BRICKS & LORRY SERVICES", 14, 20);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 200, 200);
            doc.text("Suppliers of All Building Materials | Customer Consolidated Outstanding Report", 14, 30);

            // Metadata (Right Aligned in Header)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("CUSTOMER REGISTER", 283, 20, { align: 'right' });

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`EXPORT DATE: ${new Date().toLocaleDateString('en-IN')}`, 283, 30, { align: 'right' });

            const tableData = allCustomers.map((c: any, index: number) => [
                index + 1,
                c.name.toUpperCase(),
                c.phone_no || "-",
                c.email || "-",
                formatDate(c.last_called_date),
                `Rs. ${Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
            ]);

            const totalBalance = allCustomers.reduce((sum: number, c: any) => sum + (Number(c.balance) || 0), 0);

            autoTable(doc, {
                startY: 55,
                head: [['SR.', 'CUSTOMER NAME', 'MOBILE / PHONE', 'EMAIL ADDRESS', 'LAST CALLED', 'BALANCE']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [51, 65, 85], // Slate 700
                    textColor: [255, 255, 255],
                    fontSize: 9,
                    fontStyle: 'bold',
                    cellPadding: 4,
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [30, 41, 59],
                    cellPadding: 4,
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 80 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 60 },
                    4: { cellWidth: 35, halign: 'center' },
                    5: { halign: 'right', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                margin: { horizontal: 14 }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 15;

            // Check for page overflow (Page height 210mm)
            if (finalY > 185) {
                doc.addPage();
                finalY = 25; // Start fresh on new page
            }

            // Summary Totals
            doc.setFillColor(15, 23, 42);
            doc.rect(200, finalY - 5, 83, 18, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("TOTAL OUTSTANDING:", 205, finalY + 2);
            doc.setFontSize(14);
            doc.text(`Rs. ${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 278, finalY + 10, { align: 'right' });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setTextColor(148, 163, 184);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, 148.5, 200, { align: 'center' });
                doc.text("Generated by Bricksync Ledger System", 148.5, 205, { align: 'center' });
            }

            doc.save(`Customer_Export_${new Date().toISOString().split('T')[0]}.pdf`);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-[3rem] w-full max-w-xl p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />

                <div className="flex justify-between items-start mb-10 relative">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-200 ring-8 ring-slate-50">
                            <Download size={32} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Export Hub</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
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
                    <div className="group p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-100 transition-all duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Export Mode</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tight">Consolidated (A4 Landscape)</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <CheckCircle2 size={24} className="text-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl text-amber-500 shrink-0">
                            <FileText size={20} />
                        </div>
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                            The generated report will include all active customer records with their current outstanding balances and the most recent call activity.
                        </p>
                    </div>

                    <div className="pt-4 flex flex-col gap-4">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="w-full py-6 bg-slate-900 text-white rounded-4xl font-black text-sm uppercase tracking-[0.25em] hover:bg-slate-800 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-4 active:scale-[0.97] disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-3">
                                    <Loader2 size={24} className="animate-spin" />
                                    Generating Report...
                                </span>
                            ) : (
                                <>
                                    <Download size={22} className="animate-bounce" />
                                    Download Customer PDF
                                </>
                            )}
                        </button>
                        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Landscape Orientation • Auto-calculated Balances • Premium Design
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExportCustomerModal;
