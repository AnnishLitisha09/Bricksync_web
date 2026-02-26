import React, { useState, useEffect } from 'react';
import {
    Search, Copy, Eye, User, Truck, Hash,
    CheckCircle2, XCircle, RefreshCw, FileText, MapPin
} from 'lucide-react';
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from '../../../api/base';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const InvoiceHistory: React.FC = () => {
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

    const getPdfUrl = (inv: any) => {
        if (!inv.isActive || !inv.filename) return null;
        return `${FILE_BASE_URL}/invoices/${inv.filename}`;
    };

    const copyUrl = (inv: any) => {
        const fullUrl = getPdfUrl(inv);
        if (!fullUrl) {
            toast.error("No image/PDF URL available");
            return;
        }
        navigator.clipboard.writeText(fullUrl);
        toast.success("URL copied to clipboard!");
    };

    const openPdf = (inv: any) => {
        const fullUrl = getPdfUrl(inv);
        if (!fullUrl) {
            toast.error("Invalid File Path");
            return;
        }
        window.open(fullUrl, '_blank');
    };

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Invoice History</h1>
                        <p className="text-sm text-slate-500 font-medium">Manage and track your generated invoices</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-50 focus:border-black transition-all w-64 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => fetchInvoices()}
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID & Date</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed To</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Amount</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence>
                                    {invoices.length > 0 ? (
                                        invoices.map((inv) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={inv.id}
                                                className="group hover:bg-slate-50/80 transition-all font-medium"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                            <Hash size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{inv.invoiceId}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                {new Date(inv.date).toLocaleDateString('en-GB')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-slate-800 font-black text-sm uppercase">
                                                            <User size={14} className="text-slate-300" />
                                                            {inv.billingName || inv.customerNumber || 'CASH CUSTOMER'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase truncate max-w-[180px]">
                                                            <MapPin size={10} />
                                                            {inv.deliveryPlace || 'Local'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 w-fit">
                                                            <Truck size={10} className="text-slate-400" />
                                                            {inv.vehicleNumber}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase px-1">{inv.materialName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <p className="text-sm font-black text-slate-800">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => toggleStatus(inv.id, inv.isActive)}
                                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${inv.isActive
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                : "bg-rose-50 text-rose-600 border border-rose-100"
                                                                }`}
                                                        >
                                                            {inv.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                            {inv.isActive ? 'Active' : 'Inactive'}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {inv.isActive && (
                                                            <>
                                                                <button
                                                                    onClick={() => copyUrl(inv)}
                                                                    className="p-2 text-slate-300 hover:text-black hover:bg-slate-100 rounded-xl transition-all"
                                                                    title="Copy Link"
                                                                >
                                                                    <Copy size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openPdf(inv)}
                                                                    className="p-2 text-slate-300 hover:text-black hover:bg-slate-100 rounded-xl transition-all"
                                                                    title="View Document"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center opacity-40">
                                                    <FileText size={48} className="mb-4 text-slate-300" />
                                                    <p className="text-sm font-black text-slate-400 uppercase">No invoices records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Prev
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHistory;
