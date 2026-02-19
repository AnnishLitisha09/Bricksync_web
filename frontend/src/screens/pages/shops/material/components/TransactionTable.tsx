import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Tag, Pencil, Trash2, Search } from "lucide-react";

interface TransactionTableProps {
    logs: any[];
    loading: boolean;
    onEdit: (log: any) => void;
    onDelete: (type: 'ENTRY' | 'STATEMENT', id: number) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    logs,
    loading,
    onEdit,
    onDelete
}) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Records...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="py-20 text-center">
                <Search size={40} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No material entries found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Info</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Type / Item</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount / Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                        {logs.map((l: any) => (
                            <motion.tr
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={`${l.type}-${l.id}`}
                                className="group hover:bg-slate-50/50 transition-colors"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl transition-all ${l.type === 'ENTRY' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                            <CalendarDays size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800 tabular-nums">
                                                {new Date(l.type === 'ENTRY' ? l.date : l.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {l.type === 'ENTRY' ? 'Material Receipt' : `Payment: ${l.payment_mode}`}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${l.type === 'ENTRY' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                                        <p className="text-xs font-black text-slate-700 uppercase">
                                            {l.type === 'ENTRY' ? (l.product?.product_name || 'Material') : 'Payment Recorded'}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        {l.type === 'ENTRY' ? (
                                            <>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                    {l.units} Units @ {l.office?.office_name}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {l.fields?.map((f: any, idx: number) => (
                                                        <span key={idx} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                            <Tag size={10} className="text-indigo-400" />
                                                            <span className="uppercase tracking-tighter text-[8px] text-slate-400 font-black">{f.field_name}:</span>
                                                            {f.field_value}
                                                        </span>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-500 italic max-w-xs">{l.description || 'No description'}</p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex flex-col items-end gap-2 group/actions">
                                        <p className={`text-lg font-black tabular-nums ${l.type === 'ENTRY' ? 'text-slate-800' : 'text-emerald-600'}`}>
                                            {l.type === 'ENTRY' ? '+' : '-'} ₹{Number(l.amount).toLocaleString()}
                                        </p>
                                        {l.type === 'STATEMENT' && (
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{l.bank?.name || 'Bank'}</p>
                                        )}

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit(l)}
                                                className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(l.type, l.id)}
                                                className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

export default TransactionTable;
