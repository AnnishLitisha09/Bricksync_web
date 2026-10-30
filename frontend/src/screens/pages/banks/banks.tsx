import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    CreditCard,
    Globe,
    Loader2,
    Plus,
    Smartphone,
    Wifi,
    X,
    Pencil,
    ShieldCheck
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import { useBankStore } from "../../../store/bankStore";
import toast from "react-hot-toast";
import { deobfuscate } from "../../../utils/encryption";

const BankSkeleton = () => (
    <div className="relative h-56 w-full p-6 rounded-2xl bg-slate-200 shadow-2xs overflow-hidden animate-pulse border border-slate-200/80">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        <div className="relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className="flex items-center gap-3"><div className="w-10 h-7 bg-slate-300 rounded-md" /><div className="w-5 h-5 bg-slate-300 rounded-full" /></div>
                    <div className="space-y-2"><div className="h-2 w-12 bg-slate-300 rounded" /><div className="h-5 w-32 bg-slate-300 rounded-lg" /></div>
                </div>
                <div className="w-10 h-10 bg-slate-300 rounded-xl" />
            </div>
            <div className="space-y-4">
                <div className="h-4 w-48 bg-slate-300 rounded" />
                <div className="flex justify-between items-end">
                    <div className="space-y-2"><div className="h-2 w-16 bg-slate-300 rounded" /><div className="h-4 w-24 bg-slate-300 rounded" /></div>
                    <div className="space-y-2 flex flex-col items-end"><div className="h-2 w-12 bg-slate-300 rounded" /><div className="h-6 w-20 bg-slate-300 rounded-lg" /></div>
                </div>
            </div>
        </div>
    </div>
);

// Helper component for the toggles in the popup
const ToggleButton = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${active ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-transparent text-slate-400'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-white/10' : 'bg-white shadow-sm'}`}>{icon}</div>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
            {active && <CheckCircle2 size={12} className="text-white" />}
        </div>
    </button>
);

const Banks: React.FC = () => {
    const { banks, loading, fetchBanks, updateBank, deleteBank } = useBankStore();
    const [showAllBanks, setShowAllBanks] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState({
        id: undefined as number | undefined,
        name: "",
        accountNumber: "",
        holderName: "",
        amount: "",
        bankTransfer: true,
        phonepe: false,
        gpay: false
    });

    const [analytics, setAnalytics] = useState({ todayIncome: 0, todayExpenses: 0 });

    useEffect(() => {
        fetchBanks();
        const loadStats = async () => {
            try {
                const res = await fetch(`${BASE_URL}/analytics/today-summary`, { headers: getAuthHeader() });
                const data = await res.json();
                if (data.success) {
                    setAnalytics({ todayIncome: data.todayIncome, todayExpenses: data.todayExpenses });
                }
            } catch (error) {
                console.error("Failed to fetch treasury stats", error);
            }
        };
        loadStats();
    }, [fetchBanks]);

    const treasuryData = [
        { title: "Today's Income", amount: analytics.todayIncome.toLocaleString(undefined, { minimumFractionDigits: 2 }), icon: <ArrowUpRight size={24} />, color: "bg-emerald-500", shadow: "shadow-emerald-200" },
        { title: "Today's Expenses", amount: analytics.todayExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 }), icon: <ArrowDownLeft size={24} />, color: "bg-rose-500", shadow: "shadow-rose-200" },
    ];

    const bankArray = Array.isArray(banks) ? banks : [];
    const visibleBanks = showAllBanks ? bankArray : bankArray.slice(0, 4);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.accountNumber.length < 3) {
            toast.error("Please enter a valid account number (minimum 3 digits).");
            return;
        }

        const amountNum = Number(formData.amount);
        if (!formData.id && (isNaN(amountNum) || amountNum < 0)) {
            toast.error("Opening balance cannot be negative.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (formData.id) {
                await updateBank(formData.id, {
                    name: formData.name,
                    accountNumber: formData.accountNumber,
                    holderName: formData.holderName,
                    bankTransfer: formData.bankTransfer,
                    phonepe: formData.phonepe,
                    gpay: formData.gpay
                });
                toast.success("Bank account updated successfully!");
                setIsModalOpen(false);
                setFormData({ id: undefined, name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
            } else {
                const response = await fetch(`${BASE_URL}/banks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify({ ...formData, amount: amountNum })
                });

                if (response.ok) {
                    toast.success("Bank account created successfully!");
                    await fetchBanks(true);
                    setIsModalOpen(false);
                    setFormData({ id: undefined, name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
                } else {
                    const result = await response.json();
                    toast.error(result.message || "Failed to create bank account.");
                }
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteBank(deleteId);
            toast.success("Bank account removed successfully");
            setDeleteId(null);
        } catch (error) {
            toast.error("Failed to delete bank account");
        } finally {
            setIsDeleting(false);
        }
    };

    const BankCard = ({ bank }: { bank: any }) => {
        const gradients = [
            "from-slate-900 to-slate-800",
            "from-blue-700 to-indigo-900",
            "from-emerald-700 to-teal-900",
            "from-purple-700 to-fuchsia-900"
        ];
        const cardGradient = gradients[bank.id % gradients.length];

        const handleEditClick = () => {
            setFormData({
                id: bank.id,
                name: bank.name,
                accountNumber: bank.accountNumber,
                holderName: bank.holderName,
                amount: String(deobfuscate(bank.amount)),
                bankTransfer: bank.bankTransfer,
                phonepe: bank.phonepe,
                gpay: bank.gpay
            });
            setIsModalOpen(true);
        };

        return (
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4 }}
                className={`relative h-60 w-full p-6 rounded-2xl bg-gradient-to-br ${cardGradient} shadow-md overflow-hidden group border border-white/10`}
            >
                <div className="absolute top-0 right-0 p-5 flex gap-2 z-10 transition-all group-hover:opacity-0">
                    {bank.bankTransfer && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><Globe size={12} className="text-white" /></div>}
                    {bank.phonepe && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><Smartphone size={12} className="text-purple-300" /></div>}
                    {bank.gpay && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><CheckCircle2 size={12} className="text-blue-300" /></div>}
                </div>

                <div className="absolute top-0 right-0 p-5 flex gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={handleEditClick} className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-lg border border-white/20 transition-all text-white"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(bank.id)} className="bg-red-500/30 hover:bg-red-500/50 backdrop-blur-md p-2 rounded-lg border border-red-500/20 transition-all text-red-200"><X size={14} /></button>
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded shadow-inner" />
                                <Wifi size={18} className="text-white/40 -rotate-90" />
                            </div>
                            <div>
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Bank Entity</h4>
                                <p className="text-white font-extrabold text-lg tracking-tight uppercase">{bank.name}</p>
                            </div>
                        </div>
                        <Building2 size={28} className="text-white/15" />
                    </div>
                    <div className="space-y-3">
                        <p className="text-white/90 font-mono text-base tracking-[0.25em]">•••• •••• •••• {String(bank.accountNumber).slice(-4)}</p>
                        <div className="flex justify-between items-end">
                            <div><h4 className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Holder</h4><p className="text-white font-semibold text-xs uppercase">{bank.holderName}</p></div>
                            <div className="text-right">
                                <h4 className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Balance</h4>
                                <p className="text-white font-black text-xl tabular-nums tracking-tight">
                                    <span className="text-white/50 text-xs mr-1">₹</span>
                                    {Number(deobfuscate(bank.amount)).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 animate-in font-sans">

            {/* DELETE CONFIRMATION MODAL */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {deleteId && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div key="del-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                            <motion.div key="del-modal" initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 text-center space-y-4 border border-slate-200/80">
                                <div className="mx-auto w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                                    <X size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">De-link Account?</h3>
                                    <p className="text-slate-500 font-medium text-xs">This action will permanently remove this vault entry from the network.</p>
                                </div>
                                <div className="flex gap-2.5 pt-2">
                                    <button onClick={() => setDeleteId(null)} className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer">Cancel</button>
                                    <button onClick={handleDelete} disabled={isDeleting} className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer">
                                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "De-link"}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* ADD / EDIT BANK MODAL */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                            <motion.div key="bank-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {
                                setIsModalOpen(false);
                                setFormData({ id: undefined, name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
                            }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />
                            <motion.div key="bank-modal" initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 my-auto max-h-[calc(100vh-2rem)] flex flex-col z-10">
                                <div className="p-5 sm:p-6 pb-3 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">{formData.id ? "Edit Account" : "Add Bank Account"}</h2>
                                        <p className="text-indigo-600 font-semibold text-xs mt-0.5">{formData.id ? "Update configuration" : "Link secure vault account"}</p>
                                    </div>
                                    <button onClick={() => {
                                        setIsModalOpen(false);
                                        setFormData({ id: undefined, name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
                                    }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"><X size={16} /></button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-5 sm:p-6 pt-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Bank Name</label>
                                            <input required placeholder="e.g. HDFC Bank, ICICI Bank" className="w-full h-10 px-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-xs text-slate-800" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Account Number</label>
                                            <input required placeholder="Account number digits" className="w-full h-10 px-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-xs text-slate-800" value={formData.accountNumber} onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (val.length <= 20) setFormData({ ...formData, accountNumber: val });
                                            }} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Account Holder Name</label>
                                            <input required placeholder="Full Name as per records" className="w-full h-10 px-3.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-xs text-slate-800" value={formData.holderName} onChange={(e) => setFormData({ ...formData, holderName: e.target.value })} />
                                        </div>
                                        {!formData.id && (
                                            <div>
                                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Opening Balance</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">₹</span>
                                                    <input required type="number" placeholder="0.00" className="w-full h-10 pl-8 pr-3.5 bg-white rounded-xl border border-slate-200 font-bold text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-1">
                                        <p className="text-[11px] font-semibold text-slate-500">Supported Gateways</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <ToggleButton label="Bank Transfer" active={formData.bankTransfer} onClick={() => setFormData({ ...formData, bankTransfer: !formData.bankTransfer })} icon={<Globe size={15} />} />
                                            <ToggleButton label="PhonePe" active={formData.phonepe} onClick={() => setFormData({ ...formData, phonepe: !formData.phonepe })} icon={<Smartphone size={15} className="text-purple-600" />} />
                                            <ToggleButton label="Google Pay" active={formData.gpay} onClick={() => setFormData({ ...formData, gpay: !formData.gpay })} icon={<CheckCircle2 size={15} className="text-blue-600" />} />
                                        </div>
                                    </div>

                                    <button disabled={isSubmitting} type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <> <CheckCircle2 size={16} /> {formData.id ? "Update Configuration" : "Link Secure Account"} </>}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                            <ShieldCheck size={11} /> Treasury & Ledger
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                            • {bankArray.length} Accounts Vaulted
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Bank <span className="text-indigo-600">Treasury</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500">Corporate accounts, transaction ledgers & gateways</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95 shrink-0"
                    >
                        <Plus size={16} />
                        <span>Add Account</span>
                    </button>
                </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {treasuryData.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl shadow-2xs border border-slate-200/80 relative overflow-hidden group flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{stat.title}</p>
                            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">₹{stat.amount}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl ${stat.color} text-white flex items-center justify-center shrink-0 shadow-2xs`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </section>

            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4"><div className="p-2 bg-indigo-600 rounded-lg shadow-lg"><CreditCard size={16} className="text-white" /></div><h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vaulted Accounts</h2></div>
                    {bankArray.length > 4 && (<button onClick={() => setShowAllBanks(!showAllBanks)} className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{showAllBanks ? "Collapse" : `View All (${bankArray.length})`}</button>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {loading ? [1, 2, 3, 4].map(i => <BankSkeleton key={i} />) : visibleBanks.map((bank) => <BankCard key={bank.id} bank={bank} />)}
                </div>
            </section>
        </motion.div>
    );
};

export default Banks;