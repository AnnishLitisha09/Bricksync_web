import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Loader2, FileText, Eye } from 'lucide-react';
import { BASE_URL, FILE_BASE_URL } from '../../../api/base';

const ViewInvoicePublic: React.FC = () => {
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
                const response = await fetch(`${BASE_URL}/invoices/public/status?filename=${encodeURIComponent(filename)}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    setStatus('error');
                    return;
                }

                setStatus(data.isActive ? 'active' : 'inactive');
            } catch (error) {
                console.error("Error checking invoice status:", error);
                setStatus('error');
            }
        };

        checkStatus();

        // Note: All Right-Click and Keyboard restriction listeners have been removed.
    }, [filename]);

    if (status === 'loading') {
        return (
            <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                <p className="mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest">Loading PDF...</p>
            </div>
        );
    }

    if (status === 'inactive' || status === 'error') {
        return (
            <div className="h-screen w-full bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-800">
                        {status === 'inactive' ? 'Link Expired' : 'File Not Found'}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                        {status === 'inactive'
                            ? "This invoice is no longer active."
                            : "The document you're looking for doesn't exist."}
                    </p>
                </div>
            </div>
        );
    }

    // PDF URL with standard browser parameters
    const pdfUrl = `${FILE_BASE_URL}/invoices/${filename}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-100 flex flex-col">
            {isMobile ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-white">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                        <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Invoice Available</h2>
                        <p className="text-slate-500 text-sm mt-1">Tap below to view or download your invoice</p>
                    </div>
                    <a
                        href={pdfUrl}
                        className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Eye size={20} />
                        View PDF Invoice
                    </a>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bricksync Secure Viewer</p>
                </div>
            ) : (
                <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full border-none"
                >
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-600 font-medium text-center px-4">
                            Your browser couldn't load the PDF directly.
                        </p>
                        <a
                            href={pdfUrl}
                            className="px-8 py-3 bg-slate-900 text-white rounded-full text-sm font-bold shadow-xl hover:bg-black transition-all"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open PDF in New Tab
                        </a>
                    </div>
                </object>
            )}
        </div>
    );
};

export default ViewInvoicePublic;