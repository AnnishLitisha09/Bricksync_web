import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface SummaryCardsProps {
    supplier: any;
    entriesCount: number;
    statementsCount: number;
    onExportClick: () => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
    supplier,
    entriesCount,
    statementsCount,
    onExportClick
}) => {
    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="md:col-span-2 bg-white rounded-4xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-12 bg-indigo-50/30 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />

                <div className="w-20 h-20 bg-indigo-600 text-white rounded-4xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0 z-10">
                    <TrendingUp size={36} />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Total Outstanding Balance</p>
                    <div className="flex items-baseline gap-2 justify-center md:justify-start">
                        <span className="text-4xl font-black text-slate-900 tabular-nums leading-none">
                            ₹{Number(supplier?.balance || 0).toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-slate-400">INR</span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-2 justify-center md:justify-start">
                        <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Live balance synced with all transactions
                    </p>
                </div>

                <div className="flex gap-3 z-10 w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipts</p>
                        <p className="text-sm font-black text-slate-800 tabular-nums">+{entriesCount}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 p-4 rounded-3xl text-center border border-slate-100 group-hover:bg-indigo-50 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payments</p>
                        <p className="text-sm font-black text-slate-800 tabular-nums">{statementsCount}</p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center"
            >
                <div className="absolute bottom-0 right-0 p-10 bg-white/5 rounded-full translate-x-8 translate-y-8" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Export Details</p>
                <h4 className="text-white text-lg font-black uppercase italic leading-tight mb-6">
                    Generate PDF <br />Statement Report
                </h4>
                <button
                    onClick={onExportClick}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-slate-950/20 active:scale-95"
                >
                    Download Now
                </button>
            </motion.div>
        </div>
    );
};

export default SummaryCards;
