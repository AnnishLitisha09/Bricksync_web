import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, AlertCircle, Loader2, Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BASE_URL, FILE_BASE_URL } from '../../../api/base';

const ViewInvoicePublic: React.FC = () => {
    // React Router v6 splat route (/view/invoice/*) — useParams()['*'] captures the full filename including .pdf
    const params = useParams();
    const filename = params['*'] ?? '';
    const [status, setStatus] = useState<'loading' | 'active' | 'inactive' | 'error'>('loading');

    useEffect(() => {
        const checkStatus = async () => {
            if (!filename) {
                setStatus('error');
                return;
            }

            try {
                // Parse invoiceId from filename: "Invoice_00037-2526.pdf" → "00037/2526"
                // Formula: strip "Invoice_" prefix + ".pdf" suffix, then replace last -YYYY with /YYYY
                const base = filename.replace(/^Invoice_/i, '').replace(/\.pdf$/i, '');
                // base = "00037-2526"
                const invoiceId = base.replace(/-(\d{4})$/, '/$1');
                // invoiceId = "00037/2526"

                // Use the existing search endpoint — no new backend route needed
                const response = await fetch(`${BASE_URL}/invoices?search=${encodeURIComponent(invoiceId)}&limit=1&page=1`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    setStatus('error');
                    return;
                }

                const invoices: any[] = data.data || [];
                if (invoices.length === 0) {
                    setStatus('error');
                    return;
                }

                // If any invoice record with this ID is active, show the PDF
                const anyActive = invoices.some((inv: any) => inv.isActive);
                setStatus(anyActive ? 'active' : 'inactive');
            } catch (error) {
                console.error("Error checking invoice status:", error);
                setStatus('error');
            }
        };

        checkStatus();
    }, [filename]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center space-y-4"
                >
                    <Loader2 className="w-12 h-12 text-black animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse text-sm uppercase tracking-widest">
                        Verifying Document...
                    </p>
                </motion.div>
            </div>
        );
    }

    if (status === 'inactive' || status === 'error') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-[32px] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                            {status === 'inactive' ? 'Access Restricted' : 'Not Found'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            {status === 'inactive'
                                ? "This bill is no longer available for viewing. It has been deactivated by the administrator."
                                : "We couldn't find the requested invoice. Please verify the link and try again."}
                        </p>
                    </div>
                    <div className="pt-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400 text-xs">
                            "Transparency and security are our priorities."
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const pdfUrl = `${FILE_BASE_URL}/invoices/${filename}`;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Invoice Document</h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{filename}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href={pdfUrl}
                            download
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
                            Download
                        </a>
                        <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-black/20 group"
                        >
                            <ExternalLink size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                            Open Full
                        </a>
                    </div>
                </motion.div>

                {/* PDF Viewer */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden relative"
                >
                    <iframe
                        src={`${pdfUrl}#toolbar=0`}
                        className="w-full h-full min-h-[70vh] border-none"
                        title="Invoice PDF"
                    />
                </motion.div>

                <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                    Powered by Bricksync Secure Document Viewer
                </p>
            </div>
        </div>
    );
};

export default ViewInvoicePublic;
