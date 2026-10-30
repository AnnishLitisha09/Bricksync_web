import React, { useState, useEffect } from 'react';
import {
    Search, Copy, Eye, User, Truck, Hash,
    CheckCircle2, XCircle, RefreshCw, FileText, MapPin,
    ShieldCheck, Plus, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL, getAuthHeader } from '../../../api/base';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LottieLoader from '../../../components/common/LottieLoader';

const InvoiceHistory: React.FC = () => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchInvoices();
    }, [page, search]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/invoices?page=${page}&limit=10&search=${search}`, {
                headers: getAuthHeader()
            });
            const result = await response.json();
            setInvoices(result.data || []);
            setTotalPages(result.totalPages);
        } catch (error) {
            toast.error("Failed to fetch invoices");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            const response = await fetch(`${BASE_URL}/invoices/status/${id}`, {
                method: 'PATCH',
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (response.ok) {
                toast.success(`Invoice marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
                fetchInvoices();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const getViewUrl = (inv: any) => {
        let filename = inv.filename;
        if (!filename && inv.invoiceId) {
            filename = `Invoice_${inv.invoiceId.replace(/\//g, '-')}.pdf`;
        }
        if (!filename) return null;
        return `https://www.aswath.online/view/invoice/${filename}`;
    };

    const copyUrl = (inv: any) => {
        const viewUrl = getViewUrl(inv);
        if (!viewUrl) {
            toast.error("No URL available for this invoice");
            return;
        }
        navigator.clipboard.writeText(viewUrl);
        toast.success("Shareable link copied to clipboard!");
    };

    const openPdf = (inv: any) => {
        const viewUrl = getViewUrl(inv);
        if (!viewUrl) {
            toast.error("Unable to generate view link");
            return;
        }
        window.open(viewUrl, '_blank');
    };

    return (
        <div className="space-y-6 animate-in font-sans">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                            <ShieldCheck size={11} /> Billing Archive
                        </span>
                        <span className="text-xs font-bold text-slate-400">• Generated Invoices</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Invoice <span className="text-indigo-600">History</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        Manage, share, and track all generated tax & delivery invoices
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 pl-9 pr-4 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs w-48 sm:w-60"
                        />
                    </div>

                    <button
                        onClick={() => fetchInvoices()}
                        className="size-10 bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
                        title="Refresh Invoices"
                    >
                        <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
                    </button>

                    <button
                        onClick={() => navigate("/invoices/add")}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Generate Invoice</span>
                    </button>
                </div>
            </div>

            {/* ─── INVOICE LIST ─── */}
            {isLoading && invoices.length === 0 ? (
                <LottieLoader
                    type="general"
                    message="Retrieving Invoice History"
                    size={220}
                />
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                    <th className="py-3 px-4 sm:px-6">ID & Date</th>
                                    <th className="py-3 px-4">Billed To</th>
                                    <th className="py-3 px-4">Logistics</th>
                                    <th className="py-3 px-4 text-center">Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <AnimatePresence mode="popLayout">
                                    {invoices.length > 0 ? (
                                        invoices.map((inv) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={inv.id}
                                                className="group hover:bg-slate-50/60 transition-colors"
                                            >
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 bg-slate-50 border border-slate-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                                            <Hash size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.invoiceId}</p>
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                                                                {new Date(inv.date).toLocaleDateString('en-GB')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase truncate max-w-[200px]">
                                                            <User size={13} className="text-slate-400 shrink-0" />
                                                            <span>{inv.billingName || inv.customerNumber || 'CASH CUSTOMER'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium truncate max-w-[180px]">
                                                            <MapPin size={11} className="shrink-0" />
                                                            <span>{inv.deliveryPlace || 'Local'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="space-y-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-bold text-slate-700">
                                                            <Truck size={11} className="text-indigo-600" />
                                                            {inv.vehicleNumber}
                                                        </span>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase">{inv.materialName}</p>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    <p className="text-xs font-black text-slate-900">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                                                </td>

                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleStatus(inv.id, inv.isActive)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                                            inv.isActive
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                                        }`}
                                                    >
                                                        {inv.isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                                        <span>{inv.isActive ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>

                                                <td className="py-3.5 px-4 sm:px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => copyUrl(inv)}
                                                            className="size-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
                                                            title="Copy Shareable Link"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openPdf(inv)}
                                                            className="size-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer"
                                                            title="View Document"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <FileText size={36} className="mb-2 text-slate-300" />
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No invoice records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 sm:px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Page {page} of {totalPages}</span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoiceHistory;
