import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  FileText, 
  Download, 
  CreditCard, 
  CheckCircle2, 
  PackageCheck,
  ShieldCheck 
} from "lucide-react";

interface SummaryCardsProps {
  supplier: any;
  entriesCount: number;
  statementsCount: number;
  totalProcurementAmount?: number;
  totalPaidAmount?: number;
  onExportClick: () => void;
  onPaymentClick?: () => void;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  supplier,
  entriesCount,
  statementsCount,
  totalProcurementAmount = 0,
  totalPaidAmount = 0,
  onExportClick,
  onPaymentClick
}) => {
  const balance = Number(supplier?.balance || 0);
  const isSettled = balance <= 0;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* CARD 1: OUTSTANDING BALANCE */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Current Due Balance
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  isSettled
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-rose-50 text-rose-700 border border-rose-100"
                }`}
              >
                {isSettled ? (
                  <>
                    <CheckCircle2 size={10} /> Fully Settled
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Pending Due
                  </>
                )}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                ₹{balance.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-400">INR</span>
            </div>
          </div>

          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isSettled
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
            <ShieldCheck size={14} className="text-indigo-600" />
            <span>Live reconciled ledger</span>
          </div>
          {onPaymentClick && !isSettled && (
            <button
              onClick={onPaymentClick}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <CreditCard size={13} /> Settle Now
            </button>
          )}
        </div>
      </motion.div>

      {/* CARD 2: PROCUREMENT & ACTIVITY METRICS */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Merchant Turnover
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                ₹{totalProcurementAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-400">Total</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <PackageCheck size={22} />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Procurements
            </p>
            <p className="text-sm font-black text-slate-800 tabular-nums mt-0.5">
              {entriesCount} Orders
            </p>
          </div>
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Payments
            </p>
            <p className="text-sm font-black text-emerald-600 tabular-nums mt-0.5">
              ₹{totalPaidAmount.toLocaleString("en-IN")} ({statementsCount})
            </p>
          </div>
        </div>
      </motion.div>

      {/* CARD 3: STATEMENT & REPORT EXPORT */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
              <FileText size={12} /> Statement Export
            </span>
            <span className="text-white/40 text-xs font-medium">PDF & CSV</span>
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight leading-snug">
            Official Merchant Statement
          </h4>
          <p className="text-slate-300 text-xs mt-1 leading-relaxed">
            Generate and download itemized tax invoices & ledger settlement sheets.
          </p>
        </div>

        <div className="mt-5 relative z-10">
          <button
            onClick={onExportClick}
            className="w-full h-10 px-4 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
          >
            <Download size={14} className="text-indigo-600" />
            <span>Generate & Download Statement</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SummaryCards;
