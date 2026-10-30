import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Download, Loader2, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
            // Fetch all customers without pagination limit
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

    const formatCurrency = (val: number) => {
        return `Rs. ${Number(val || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
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

            // 1. SIGNATURE EXECUTIVE HEADER (Dark Slate & Gold - matching official Account Statement)
            doc.setFillColor(15, 23, 42); // Slate 900
            doc.rect(0, 0, 297, 44, 'F');

            // Company Gold Accent Line (Amber 500 / Gold)
            doc.setFillColor(234, 179, 8);
            doc.rect(0, 41, 297, 3, 'F');

            // Company Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("M.ASWATH", 14, 20);

            // Subtitle
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 200, 200);
            doc.text("HOLLOW BRICKS & LORRY SERVICES", 14, 28);
            doc.text("Suppliers of All Building Materials | Customer Consolidated Register", 14, 34);

            // Metadata on Right
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("CUSTOMER REGISTER", 283, 20, { align: 'right' });

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 200, 200);
            doc.text(`DATE: ${new Date().toLocaleDateString('en-IN')}`, 283, 28, { align: 'right' });
            doc.text(`TOTAL ACCOUNTS: ${allCustomers.length} CUSTOMERS`, 283, 34, { align: 'right' });

            // 2. TABLE DATA MAPPING
            // Format: [SL, CUSTOMER NAME, PHONE NUMBER, TOTAL SALES, TOTAL PAID, BALANCE]
            const tableData = allCustomers.map((c: any, index: number) => {
                const sales = Number(c.total_sales || 0);
                const paid = Number(c.total_paid || 0);
                const balance = Number(c.balance || 0);

                return [
                    index + 1,
                    (c.name || "").toUpperCase(),
                    c.phone_no && c.phone_no.trim() ? c.phone_no : "Not provided",
                    formatCurrency(sales),
                    formatCurrency(paid),
                    formatCurrency(balance)
                ];
            });

            // Calculate Totals
            const totalSales = allCustomers.reduce((sum: number, c: any) => sum + (Number(c.total_sales) || 0), 0);
            const totalPaid = allCustomers.reduce((sum: number, c: any) => sum + (Number(c.total_paid) || 0), 0);
            const totalBalance = allCustomers.reduce((sum: number, c: any) => sum + (Number(c.balance) || 0), 0);

            // 3. AUTO TABLE RENDERING (Clean, Elegant, Striped, No Clown Colors)
            autoTable(doc, {
                startY: 50,
                head: [['SL.', 'CUSTOMER NAME', 'PHONE NUMBER', 'TOTAL SALES', 'TOTAL PAID', 'BALANCE']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [241, 245, 249], // Slate 100
                    textColor: [15, 23, 42],    // Slate 900
                    fontSize: 8,
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [200, 200, 200],
                    cellPadding: 3.5,
                },
                bodyStyles: {
                    fontSize: 8.5,
                    textColor: [51, 65, 85],     // Slate 700 (Clean, professional, non-colorful)
                    cellPadding: 3.5,
                },
                alternateRowStyles: {
                    fillColor: [252, 252, 252]
                },
                columnStyles: {
                    0: { cellWidth: 14, halign: 'center' },
                    1: { cellWidth: 80, fontStyle: 'bold' },
                    2: { cellWidth: 45, halign: 'center' },
                    3: { cellWidth: 43, halign: 'right', fontStyle: 'bold', textColor: [51, 65, 85] },
                    4: { cellWidth: 43, halign: 'right', fontStyle: 'bold', textColor: [51, 65, 85] },
                    5: { cellWidth: 44, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
                },
                margin: { left: 14, right: 14 }
            });

            let finalY = (doc as any).lastAutoTable.finalY + 12;

            // Check for page overflow (Landscape A4 page height is 210mm)
            if (finalY + 30 > 192) {
                doc.addPage();
                finalY = 22;
            }

            // 4. CLEAN EXECUTIVE SUMMARY (Matching Ledger Statement Style)
            // Summary Totals Horizontal Rule
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(108, finalY - 4, 283, finalY - 4);

            // Summary Totals Row (Aligned directly under the columns)
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text("TOTAL TRANSACTIONS", 108, finalY + 1);
            doc.text(formatCurrency(totalSales), 196, finalY + 1, { align: 'right' });
            doc.text(formatCurrency(totalPaid), 239, finalY + 1, { align: 'right' });
            doc.text(formatCurrency(totalBalance), 283, finalY + 1, { align: 'right' });

            // Outstanding Balance Bar (Signature Dark Slate Box with Gold Accent)
            doc.setFillColor(15, 23, 42);
            doc.rect(153, finalY + 7, 130, 18, 'F');

            // Left Gold Accent Bar
            doc.setFillColor(234, 179, 8);
            doc.rect(153, finalY + 7, 3, 18, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("TOTAL OUTSTANDING BALANCE", 162, finalY + 14);

            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.text(formatCurrency(totalBalance), 277, finalY + 21, { align: 'right' });

            // 5. FOOTER ON ALL PAGES
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Subtle footer line
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.2);
                doc.line(14, 198, 283, 198);

                doc.setTextColor(148, 163, 184); // Slate 400
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "normal");
                doc.text(`Page ${i} of ${pageCount}`, 14, 203);
                doc.text("This is an official commercial report from M.ASWATH HOLLOW BRICKS & LORRY SERVICES.", 148.5, 203, { align: 'center' });
                doc.text(`${new Date().toLocaleDateString('en-IN')}`, 283, 203, { align: 'right' });
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
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 overflow-hidden border border-slate-200/80">
                <div className="flex justify-between items-center mb-6 relative">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
                            <Download size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Export Client Directory</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-slate-400 text-xs font-semibold">Ready for PDF Generation</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 relative">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Export Mode</p>
                                <p className="text-sm font-black text-slate-900 tracking-tight">Consolidated Client Ledger (A4 Landscape)</p>
                            </div>
                            <div className="size-8 bg-white rounded-lg flex items-center justify-center shadow-2xs border border-slate-200/60">
                                <CheckCircle2 size={16} className="text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3.5">
                        <div className="p-2 bg-slate-900 rounded-xl text-amber-400 shrink-0 shadow-2xs">
                            <FileText size={20} />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                            Official format with <span className="text-slate-900 font-bold">SL, Customer Name, Phone Number, Total Sales, Total Paid, and Balance</span> styled with the signature Dark Slate & Gold executive statement theme.
                        </p>
                    </div>

                    <div className="pt-3 flex flex-col gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-md shadow-slate-900/20 hover:shadow-slate-900/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2.5">
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating Report...
                                </span>
                            ) : (
                                <>
                                    <Download size={18} />
                                    Download Customer PDF
                                </>
                            )}
                        </button>
                        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Landscape A4 • Dark Slate & Gold Identity • Non-colorful Executive Design
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ExportCustomerModal;
