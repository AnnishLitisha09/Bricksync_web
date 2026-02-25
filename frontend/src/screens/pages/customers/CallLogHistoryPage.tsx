import { useEffect, useState } from "react";
import {
    User,
    ArrowLeft,
    Calendar,
    Search,
    CheckCircle2,
    XCircle,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Filter,
    Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchCallLogs, toggleCallStatus, deleteCallLog } from "../../../api/callLog";

export default function CallLogHistoryPage() {
    const navigate = useNavigate();
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, call: any | null }>({
        show: false,
        call: null
    });

    const [deleteModal, setDeleteModal] = useState<{ show: boolean, call: any | null }>({
        show: false,
        call: null
    });

    const itemsPerPage = 10;

    useEffect(() => {
        const loadCalls = async () => {
            setLoading(true);
            try {
                const res = await fetchCallLogs(currentPage, itemsPerPage, search);
                setCalls(res.data || []);
                setTotalPages(res.totalPages || 1);
                setTotalCount(res.total || 0);
            } catch (error) {
                console.error("Failed to fetch call logs", error);
            } finally {
                setLoading(false);
            }
        };
        loadCalls();
    }, [currentPage, search, refreshTrigger]);

    const handleStatusToggle = async () => {
        if (!confirmModal.call) return;
        try {
            await toggleCallStatus(confirmModal.call.id);
            setRefreshTrigger(prev => prev + 1);
            setConfirmModal({ show: false, call: null });
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const handleDeleteLog = async () => {
        if (!deleteModal.call) return;
        try {
            await deleteCallLog(deleteModal.call.id);
            setRefreshTrigger(prev => prev + 1);
            setDeleteModal({ show: false, call: null });
        } catch (error) {
            console.error("Failed to delete call log", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-h-screen bg-gray-50/50 p-3 md:p-8 space-y-4 md:space-y-6"
        >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4 md:mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm text-slate-400 hover:text-orange-600 transition-all border border-gray-100"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
                        Call <span className="text-orange-600">Logs</span>
                    </h1>
                    <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Customer Communication</p>
                </div>
                <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm text-orange-600 border border-gray-100">
                    <Filter size={18} />
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="bg-white p-3 md:p-4 rounded-3xl md:rounded-4xl shadow-sm border border-gray-100">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by customer name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-11 pr-4 py-3 md:py-4 border-none rounded-xl md:rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                    />
                </div>
            </div>

            {/* TABLE CONTAINER */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-5 text-left">Customer</th>
                                <th className="px-6 py-5 text-left">Called Date</th>
                                <th className="px-6 py-5 text-left">Next Date</th>
                                <th className="px-6 py-5 text-left">Remark</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-600 rounded-full mx-auto"
                                        />
                                    </td>
                                </tr>
                            ) : calls.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                                        No call logs found
                                    </td>
                                </tr>
                            ) : (
                                calls.map((call) => (
                                    <tr key={call.id} className="group hover:bg-orange-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                                    <User size={14} />
                                                </div>
                                                <div>
                                                    <div className="text-slate-800 font-black text-sm uppercase">{call.customer?.name}</div>
                                                    <div className="text-slate-400 font-bold text-[10px]">{call.customer?.phone_no}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase">
                                                <Calendar size={14} className="text-orange-500" />
                                                {new Date(call.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {call.next_call_date ? (
                                                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase">
                                                    <Calendar size={14} className="text-blue-500" />
                                                    {new Date(call.next_call_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-[10px] font-bold uppercase italic">Not Set</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex items-start gap-2 text-slate-500 font-medium text-xs line-clamp-2">
                                                <MessageSquare size={14} className="text-slate-300 shrink-0 mt-0.5" />
                                                {call.description || "No remark"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider
                        ${call.is_called
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-orange-100 text-orange-700"}`}
                                            >
                                                {call.is_called ? "Completed" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setConfirmModal({ show: true, call })}
                                                    className={`p-2 rounded-xl transition-all shadow-sm
                            ${call.is_called
                                                            ? "bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-600"
                                                            : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}
                                                >
                                                    {call.is_called ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ show: true, call })}
                                                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="bg-slate-50/50 px-4 md:px-8 py-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {totalCount} Logs Found
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-white rounded-lg border border-gray-100 text-slate-400 disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${currentPage === page
                                                ? "bg-orange-600 text-white shadow-md"
                                                : "bg-white text-slate-400 border border-gray-100"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-white rounded-lg border border-gray-100 text-slate-400 disabled:opacity-30"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal({ show: false, call: null })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/20"
                        >
                            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-6">
                                <Filter size={32} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                Updating <span className="text-orange-600">Status</span>
                            </h3>
                            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
                                Are you sure you want to mark this call with <span className="text-slate-900 font-black">{confirmModal.call?.customer?.name}</span> as <span className="text-orange-600 font-black">{confirmModal.call?.is_called ? "NOT COMPLETED" : "COMPLETED"}</span>?
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmModal({ show: false, call: null })}
                                    className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStatusToggle}
                                    className="flex-1 py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteModal({ show: false, call: null })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/20"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6">
                                <Trash2 size={32} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                Delete <span className="text-red-600">Log</span>
                            </h3>
                            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
                                Are you sure you want to delete this call log for <span className="text-slate-900 font-black">{deleteModal.call?.customer?.name}</span>? This action cannot be undone.
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteModal({ show: false, call: null })}
                                    className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteLog}
                                    className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
