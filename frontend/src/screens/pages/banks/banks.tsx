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
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import { useBankStore } from "../../../store/bankStore";
import { BASE_URL, getAuthHeader } from "../../../api/base";

const treasuryData = [
    { title: "Today's Income", amount: "12,340.00", icon: <ArrowUpRight size={24} />, color: "bg-emerald-600" },
    { title: "Today's Expenses", amount: "8,254.18", icon: <ArrowDownLeft size={24} />, color: "bg-orange-600" },
];

const Banks: React.FC = () => {
    const { banks, loading, fetchBanks } = useBankStore();
    const [showAllBanks, setShowAllBanks] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        accountNumber: "",
        holderName: "",
        amount: "",
        bankTransfer: true,
        phonepe: false,
        gpay: false
    });

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    // Ensure we are working with an array to avoid .slice errors
    const bankArray = Array.isArray(banks) ? banks : [];
    const visibleBanks = showAllBanks ? bankArray : bankArray.slice(0, 4);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/banks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    ...formData,
                    amount: Number(formData.amount)
                })
            });

            if (response.ok) {
                await fetchBanks(); 
                setIsModalOpen(false);
                setFormData({ name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
            }
        } catch (error) {
            console.error("Submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const BankCard = ({ bank }: { bank: any }) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -8 }}
            className="relative bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group"
        >
            <div className="absolute top-0 right-0 p-4 flex gap-2">
                {bank.gpay && (
                    <div className="bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        <span className="text-[8px] font-black text-blue-600">GPAY</span>
                        <CheckCircle2 size={10} className="text-blue-500" />
                    </div>
                )}
                {bank.phonepe && (
                    <div className="bg-purple-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        <span className="text-[8px] font-black text-purple-600">PE</span>
                        <CheckCircle2 size={10} className="text-purple-500" />
                    </div>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors shadow-inner">
                    <Building2 size={24} />
                </div>
                
                <div>
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Holder</h4>
                    <p className="text-slate-900 font-bold text-lg truncate leading-tight">{bank.holderName}</p>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{bank.name}</h4>
                        <p className="text-slate-500 font-medium text-xs tracking-widest">
                            •••• {String(bank.accountNumber).slice(-4)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase italic leading-none">Balance</p>
                        <p className="text-slate-900 font-black text-base">₹{Number(bank.amount).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
            
            {/* LINK MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Link <span className="text-orange-600">Account</span></h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input required placeholder="Bank Name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                <input required placeholder="Account Number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} />
                                <input required placeholder="Holder Name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" value={formData.holderName} onChange={(e) => setFormData({...formData, holderName: e.target.value})} />
                                <input required type="number" placeholder="Initial Balance" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 font-bold" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.gpay ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                        <input type="checkbox" className="hidden" checked={formData.gpay} onChange={(e) => setFormData({...formData, gpay: e.target.checked})} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">GPay</span>
                                    </label>
                                    <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${formData.phonepe ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white border-slate-100 text-slate-400'}`}>
                                        <input type="checkbox" className="hidden" checked={formData.phonepe} onChange={(e) => setFormData({...formData, phonepe: e.target.checked})} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">PhonePe</span>
                                    </label>
                                </div>

                                <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Link Bank Account"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900 rounded-2xl shadow-lg"><Building2 className="text-white" size={28} /></div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Treasury <span className="text-orange-600 italic font-serif">Hub</span></h1>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] pl-1">Authorized Node Active</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">
                    <Plus size={16} strokeWidth={3} /> Link New Account
                </motion.button>
            </header>

            {/* CAPITAL PULSE STATS */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {treasuryData.map((stat, i) => (
                    <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-64 h-64 ${stat.color} opacity-[0.03] blur-3xl rounded-full -mr-24 -mt-24`} />
                        <div className="flex justify-between items-center mb-8">
                            <div className={`p-5 rounded-[1.5rem] ${stat.color} text-white shadow-xl shadow-current/20`}>{stat.icon}</div>
                            <span className="text-[10px] font-black px-4 py-2 rounded-full border border-slate-100 text-slate-400 uppercase tracking-widest">Live</span>
                        </div>
                        <p className="text-slate-400 text-[12px] font-black uppercase tracking-[0.25em]">{stat.title}</p>
                        <h3 className="text-5xl font-black text-slate-900 mt-2 tracking-tighter tabular-nums">₹{stat.amount}</h3>
                    </div>
                ))}
            </section>

            {/* BANKS GRID */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-orange-500" />
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Vaulted Accounts</h2>
                    </div>
                    {bankArray.length > 4 && (
                        <button onClick={() => setShowAllBanks(!showAllBanks)} className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-5 py-2.5 rounded-2xl">
                            {showAllBanks ? "Collapse" : `View All (${bankArray.length})`}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-white rounded-[2.5rem] animate-pulse" />)
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {visibleBanks.map((bank) => (
                                <BankCard key={bank.id} bank={bank} />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </section>

            {/* COMMAND CENTER */}
            <section className="space-y-6 pb-20">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-orange-500" />
                    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Command Center</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <QuickAction icon={<Send size={20} />} label="Transfer" color="bg-slate-900" />
                    <QuickAction icon={<Download size={20} />} label="Deposit" color="bg-emerald-600" />
                    <QuickAction icon={<ArrowRightLeft size={20} />} label="Settle" color="bg-orange-600" />
                    <QuickAction icon={<Wallet size={20} />} label="Cards" color="bg-blue-600" />
                    <QuickAction icon={<HistoryIcon size={20} />} label="Reports" color="bg-purple-600" />
                    <QuickAction icon={<LayoutGrid size={20} />} label="Ledger" color="bg-rose-600" />
                </div>
            </section>
        </motion.div>
    );
};

const QuickAction = ({ icon, label, color }: { icon: any, label: string, color: string }) => (
    <motion.button whileHover={{ y: -5 }} className="flex flex-col items-center justify-center gap-3 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:border-orange-200 group">
        <div className={`p-4 rounded-2xl ${color} text-white group-hover:rotate-12 transition-transform shadow-lg`}>{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-600">{label}</span>
    </motion.button>
);

export default Banks;