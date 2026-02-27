import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-100">
            {/* The PDF is now the only element on the page */}
            <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full border-none"
            >
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <p className="text-slate-600 font-medium">Your browser cannot display this PDF in-page.</p>
                    <a
                        href={pdfUrl}
                        className="px-6 py-2 bg-black text-white rounded-full text-sm font-bold"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Download Invoice
                    </a>
                </div>
            </object>
        </div>
    );
};

export default ViewInvoicePublic;