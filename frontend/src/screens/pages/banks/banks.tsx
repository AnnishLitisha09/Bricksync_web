import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  LayoutGrid,
  Zap,
  Plus,
  Send,
  Download,
  Wallet,
  ArrowRightLeft,
  History as HistoryIcon,
  CheckCircle2
} from "lucide-react";
import { useBankStore } from "../../../store/bankStore";

// Import the store we just created

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

const treasuryData = [
    { title: "Today's Income", amount: "12,340.00", change: "+8.2%", icon: <ArrowUpRight size={24} />, color: "bg-emerald-600" },
    { title: "Today's Expenses", amount: "8,254.18", change: "-3.1%", icon: <ArrowDownLeft size={24} />, color: "bg-orange-600", positive: false },
];

const Banks: React.FC = () => {
    // Consume Zustand Store
    const { banks, loading, fetchBanks } = useBankStore();
    const [showAllBanks, setShowAllBanks] = useState(false);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    const visibleBanks = showAllBanks ? banks : banks.slice(0, 4);

    const handleAction = (action: string) => {
        alert(`${action} initialized!`);
    };

    const BankCard = ({ bank }: { bank: any }) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="relative bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4">
                {bank.Gpay && (
                    <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">GPay</span>
                        <CheckCircle2 size={10} className="text-blue-500" />
                    </div>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shadow-inner">
                    <Building2 size={24} />
                </div>
                
                <div>
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Holder Name</h4>
                    <p className="text-slate-900 font-bold text-lg truncate leading-tight">{bank.holderName}</p>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{bank.name}</h4>
                        <p className="text-slate-500 font-medium text-xs tracking-widest">
                            •••• {bank.accountNumber.slice(-4)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase italic leading-none">Net Balance</p>
                        <p className="text-slate-900 font-black text-base">₹{Number(bank.amount).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const QuickActionButton = ({ icon, label, color, onClick }: QuickActionProps) => (
        <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-orange-200 group"
        >
            <div className={`p-4 rounded-2xl ${color} text-white group-hover:rotate-12 transition-transform shadow-lg`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-600">
                {label}
            </span>
        </motion.button>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-12 max-w-7xl mx-auto"
        >
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <motion.div 
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 6 }}
                            className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200"
                        >
                            <Building2 className="text-white" size={28} />
                        </motion.div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                            Treasury <span className="text-orange-600 italic font-serif">Hub</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] pl-1">
                        DevTunnel Ledger Sync Active
                    </p>
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "#000" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction('Add Bank')}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all"
                >
                    <Plus size={16} strokeWidth={3} />
                    Link New Account
                </motion.button>
            </header>

            {/* STATS SECTION */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 px-1">
                    <LayoutGrid size={14} className="text-orange-500" />
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Capital Pulse</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {treasuryData.map((stat, i) => (
                        <motion.div key={i} whileHover={{ y: -8 }} className="relative bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 group overflow-hidden">
                            <div className={`absolute top-0 right-0 w-64 h-64 ${stat.color} opacity-[0.03] blur-3xl rounded-full -mr-24 -mt-24`} />
                            <div className="flex justify-between items-center mb-8">
                                <div className={`p-5 rounded-[1.5rem] ${stat.color} text-white shadow-xl shadow-current/20`}>{stat.icon}</div>
                                <span className="text-[10px] font-black px-4 py-2 rounded-full border border-slate-100 text-slate-400 bg-slate-50/50 uppercase tracking-widest">Network Live</span>
                            </div>
                            <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.25em]">{stat.title}</p>
                            <h3 className="text-5xl font-black text-slate-900 mt-2 tracking-tighter tabular-nums">₹{stat.amount}</h3>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* BANKS GRID */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-orange-500" />
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Vaulted Accounts</h2>
                    </div>
                    {banks.length > 4 && (
                        <button 
                            onClick={() => setShowAllBanks(!showAllBanks)}
                            className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 hover:bg-orange-100 px-5 py-2.5 rounded-2xl transition-all border border-orange-100"
                        >
                            {showAllBanks ? "Collapse View" : `View All (${banks.length})`}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-56 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {visibleBanks.map((bank) => (
                                <BankCard key={bank.id} bank={bank} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </section>

            {/* QUICK PORTAL */}
            <section className="space-y-6 pb-20">
                <div className="flex items-center gap-2 px-1">
                    <Zap size={14} className="text-orange-500" />
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Command Center</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <QuickActionButton icon={<Send size={20} />} label="Transfer" color="bg-slate-900" onClick={() => handleAction('Transfer')} />
                    <QuickActionButton icon={<Download size={20} />} label="Deposit" color="bg-emerald-600" onClick={() => handleAction('Deposit')} />
                    <QuickActionButton icon={<ArrowRightLeft size={20} />} label="Settle" color="bg-orange-600" onClick={() => handleAction('Settle')} />
                    <QuickActionButton icon={<Wallet size={20} />} label="Cards" color="bg-blue-600" onClick={() => handleAction('Cards')} />
                    <QuickActionButton icon={<HistoryIcon size={20} />} label="Reports" color="bg-purple-600" onClick={() => handleAction('Reports')} />
                    <QuickActionButton icon={<LayoutGrid size={20} />} label="Ledger" color="bg-rose-600" onClick={() => handleAction('Ledger')} />
                </div>
            </section>
        </motion.div>
    );
};

export default Banks;