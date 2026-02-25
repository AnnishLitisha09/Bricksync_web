import { AnimatePresence, motion } from "framer-motion";
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
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import { useBankStore } from "../../../store/bankStore";
import toast from "react-hot-toast";

const treasuryData = [
    { title: "Today's Income", amount: "12,340.00", icon: <ArrowUpRight size={24} />, color: "bg-emerald-500", shadow: "shadow-emerald-200" },
    { title: "Today's Expenses", amount: "8,254.18", icon: <ArrowDownLeft size={24} />, color: "bg-rose-500", shadow: "shadow-rose-200" },
];

const BankSkeleton = () => (
    <div className="relative h-64 w-full p-8 rounded-[2.5rem] bg-slate-200 shadow-sm overflow-hidden animate-pulse border border-slate-100">
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
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'bg-orange-500 border-orange-500' : 'border-slate-200'}`}>
            {active && <CheckCircle2 size={12} className="text-white" />}
        </div>
    </button>
);

const Banks: React.FC = () => {
    const { banks, loading, fetchBanks } = useBankStore();
    const [showAllBanks, setShowAllBanks] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- OTP State ---
    const [isVerified, setIsVerified] = useState(false);
    const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [isOTPSending, setIsOTPSending] = useState(false);
    const [isOTPVerifying, setIsOTPVerifying] = useState(false);
    const [otpError, setOtpError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        accountNumber: "",
        holderName: "",
        amount: "",
        bankTransfer: true,
        phonepe: false,
        gpay: false
    });

    useEffect(() => { fetchBanks(); }, [fetchBanks]);

    const bankArray = Array.isArray(banks) ? banks : [];
    const visibleBanks = showAllBanks ? bankArray : bankArray.slice(0, 4);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.accountNumber.length !== 16) {
            toast.error("Account number must be exactly 16 digits.");
            return;
        }

        const amountNum = Number(formData.amount);
        if (amountNum <= 0) {
            toast.error("Opening balance must be a positive number.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/banks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ ...formData, amount: amountNum })
            });

            if (response.ok) {
                toast.success("Bank account created successfully!");
                await fetchBanks();
                setIsModalOpen(false);
                setFormData({ name: "", accountNumber: "", holderName: "", amount: "", bankTransfer: true, phonepe: false, gpay: false });
            } else {
                const result = await response.json();
                toast.error(result.message || "Failed to create bank account.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendOTP = async () => {
        setIsOTPSending(true);
        try {
            const res = await fetch(`${BASE_URL}/otp/send`, {
                method: 'POST',
                headers: getAuthHeader()
            });
            const data = await res.json();
            if (data.success) {
                setIsOTPModalOpen(true);
            } else {
                alert(data.message || "Failed to send OTP");
            }
        } catch (error) {
            console.error("OTP Send Error:", error);
        } finally {
            setIsOTPSending(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsOTPVerifying(true);
        setOtpError("");
        try {
            const res = await fetch(`${BASE_URL}/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify({ code: otpValue })
            });
            const data = await res.json();
            if (data.success) {
                setIsVerified(true);
                setIsOTPModalOpen(false);
            } else {
                setOtpError(data.message || "Invalid OTP");
            }
        } catch (error) {
            console.error("OTP Verify Error:", error);
        } finally {
            setIsOTPVerifying(false);
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

        return (
            <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -10 }}
                className={`relative h-64 w-full p-8 rounded-[2.5rem] bg-gradient-to-br ${cardGradient} shadow-2xl overflow-hidden group border border-white/10`}
            >
                <div className="absolute top-0 right-0 p-6 flex gap-2 z-10">
                    {bank.bankTransfer && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><Globe size={12} className="text-white" /></div>}
                    {bank.phonepe && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><Smartphone size={12} className="text-purple-300" /></div>}
                    {bank.gpay && <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-lg border border-white/20"><CheckCircle2 size={12} className="text-blue-300" /></div>}
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-md shadow-inner" />
                                <Wifi size={20} className="text-white/30 -rotate-90" />
                            </div>
                            <div>
                                <h4 className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Bank Entity</h4>
                                <p className="text-white font-black text-xl tracking-tighter uppercase">{bank.name}</p>
                            </div>
                        </div>
                        <Building2 size={32} className="text-white/10" />
                    </div>
                    <div className="space-y-4">
                        <p className="text-white/80 font-mono text-lg tracking-[0.25em]">•••• •••• •••• {String(bank.accountNumber).slice(-4)}</p>
                        <div className="flex justify-between items-end">
                            <div><h4 className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Account Holder</h4><p className="text-white font-bold text-sm uppercase">{bank.holderName}</p></div>
                            <div className="text-right">
                                <h4 className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">Balance</h4>
                                {isVerified ? (
                                    <p className="text-white font-black text-2xl tabular-nums tracking-tighter"><span className="text-white/40 text-sm mr-1">₹</span>{Number(bank.amount).toLocaleString()}</p>
                                ) : (
                                    <p className="text-white font-black text-2xl tabular-nums tracking-tighter select-none">••••</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-12 max-w-7xl mx-auto">

            <AnimatePresence>
                {/* OTP VERIFICATION MODAL */}
                {isOTPModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOTPModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 space-y-8 border border-white">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
                                    <CheckCircle2 className="text-indigo-600" size={32} />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter">Enter OTP</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest px-4">Verification code sent to bricksync0001@gmail.com</p>
                            </div>

                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <div className="space-y-4">
                                    <input
                                        required
                                        type="text"
                                        maxLength={6}
                                        placeholder="0 0 0 0 0 0"
                                        className={`w-full text-center px-6 py-5 bg-slate-50 border-2 rounded-[2rem] font-black text-3xl tracking-[0.5em] outline-none transition-all ${otpError ? 'border-red-200 bg-red-50 text-red-600' : 'border-transparent focus:border-indigo-500/20'}`}
                                        value={otpValue}
                                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                    />
                                    {otpError && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{otpError}</p>}
                                </div>

                                <button
                                    disabled={isOTPVerifying}
                                    type="submit"
                                    className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl"
                                >
                                    {isOTPVerifying ? <Loader2 className="animate-spin" size={18} /> : "Verify Access"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* ADD BANK MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-10 space-y-6 border border-slate-100">
                            <div className="flex justify-between items-center">
                                <div><h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Vault</h2><p className="text-orange-600 font-black text-[10px] uppercase tracking-widest mt-1">Initialize Protocol</p></div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-3">
                                    <input required placeholder="Bank Name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500/20 outline-none font-bold placeholder:text-slate-300" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                    <input required placeholder="Account Number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500/20 outline-none font-bold placeholder:text-slate-300" value={formData.accountNumber} onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (val.length <= 16) setFormData({ ...formData, accountNumber: val });
                                    }} />
                                    <input required placeholder="Holder Name" className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-orange-500/20 outline-none font-bold placeholder:text-slate-300" value={formData.holderName} onChange={(e) => setFormData({ ...formData, holderName: e.target.value })} />
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₹</span>
                                        <input required type="number" placeholder="0.00" className="w-full pl-12 pr-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xl focus:ring-4 focus:ring-orange-500/20 outline-none" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Supported Gateways</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <ToggleButton label="Bank Transfer" active={formData.bankTransfer} onClick={() => setFormData({ ...formData, bankTransfer: !formData.bankTransfer })} icon={<Globe size={16} />} />
                                        <ToggleButton label="PhonePe" active={formData.phonepe} onClick={() => setFormData({ ...formData, phonepe: !formData.phonepe })} icon={<Smartphone size={16} className="text-purple-500" />} />
                                        <ToggleButton label="Google Pay" active={formData.gpay} onClick={() => setFormData({ ...formData, gpay: !formData.gpay })} icon={<CheckCircle2 size={16} className="text-blue-500" />} />
                                    </div>
                                </div>

                                <button disabled={isSubmitting} type="submit" className="w-full py-5 bg-orange-600 hover:bg-orange-700 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-200">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <> <CheckCircle2 size={18} /> Link Secure Account </>}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 rounded-full border border-orange-100">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Network Protocol Active</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-slate-900 rounded-[2rem] shadow-2xl rotate-3"><Building2 className="text-white" size={32} /></div>
                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Treasury</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {!isVerified && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            onClick={handleSendOTP}
                            disabled={isOTPSending}
                            className="flex items-center gap-3 px-8 py-5 bg-emerald-600 text-white rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-emerald-100"
                        >
                            {isOTPSending ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} strokeWidth={4} />}
                            {isOTPSending ? "Sending OTP..." : "Unlock Balances"}
                        </motion.button>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl">
                        <Plus size={16} strokeWidth={4} /> Initialize New Account
                    </motion.button>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {treasuryData.map((stat, i) => (
                    <div key={i} className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-80 h-80 ${stat.color} opacity-[0.03] blur-3xl rounded-full -mr-32 -mt-32`} />
                        <div className="flex justify-between items-center mb-10">
                            <div className={`p-6 rounded-[2rem] ${stat.color} text-white shadow-2xl ${stat.shadow}`}>{stat.icon}</div>
                        </div>
                        <p className="text-slate-400 text-[13px] font-black uppercase tracking-[0.3em] mb-2">{stat.title}</p>
                        {isVerified ? (
                            <h3 className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">₹{stat.amount}</h3>
                        ) : (
                            <h3 className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none select-none">••••</h3>
                        )}
                    </div>
                ))}
            </section>

            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4"><div className="p-2 bg-orange-600 rounded-lg shadow-lg"><CreditCard size={16} className="text-white" /></div><h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Vaulted Accounts</h2></div>
                    {bankArray.length > 4 && (<button onClick={() => setShowAllBanks(!showAllBanks)} className="text-[11px] font-black text-orange-600 uppercase tracking-[0.2em]">{showAllBanks ? "Collapse" : `View All (${bankArray.length})`}</button>)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {loading ? [1, 2, 3, 4].map(i => <BankSkeleton key={i} />) : visibleBanks.map((bank) => <BankCard key={bank.id} bank={bank} />)}
                </div>
            </section>
        </motion.div>
    );
};

export default Banks;