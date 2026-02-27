import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';
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

        // Security: Prevent Right Click, Print (Ctrl+P), and Save (Ctrl+S)
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isCmdOrCtrl = e.ctrlKey || e.metaKey;

            if (
                e.key === "F12" ||
                (isCmdOrCtrl && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
                (isCmdOrCtrl && (key === "u" || key === "p" || key === "s"))
            ) {
                e.preventDefault();
                if (key === 'p' || key === 's') {
                    alert("Printing and saving is disabled for this secure document.");
                }
            }
        };
        
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
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
                                ? "This bill is no longer available for viewing."
                                : "We couldn't find the requested invoice. Please verify the link."}
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // PDF parameters to strip UI
    const pdfUrl = `${FILE_BASE_URL}/invoices/${filename}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center overflow-y-auto py-12 px-4 selection:bg-transparent">
            <div className="max-w-4xl w-full flex flex-col space-y-8">

                {/* Centered Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center space-y-3"
                >
                    <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                        <FileText size={28} />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Invoice Document</h1>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">{filename}</p>
                    </div>
                </motion.div>

                {/* PDF Paper-style Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative w-full bg-white rounded-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
                >
                    {/* Security Shield Overlay: Blocks interaction with the underlying object */}
                    <div 
                        className="absolute inset-0 z-10 bg-transparent cursor-default" 
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    {/* PDF Object */}
                    <object
                        data={pdfUrl}
                        type="application/pdf"
                        className="w-full h-[1150px] block pointer-events-none"
                    >
                        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                            <AlertCircle className="text-slate-300 w-12 h-12" />
                            <p className="text-slate-500 font-medium">Unable to load the secure viewer.</p>
                        </div>
                    </object>
                </motion.div>

                <footer className="pb-12 pt-4">
                    <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] opacity-50">
                        Bricksync Secure Document Viewer
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default ViewInvoicePublic;