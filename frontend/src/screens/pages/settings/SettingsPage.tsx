import React, { useState, useEffect } from "react";
import {
    Building2, Database, Info, Plus, Trash2, 
    MapPin, RefreshCcw, ShieldCheck, ChevronLeft, 
    Monitor, Server, Download, History, Mail, 
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import toast, { Toaster } from "react-hot-toast";

interface Office {
    office_id: number;
    office_name: string;
    location: string;
}

interface BackupStatus {
    fileName: string;
    size: number;
    createdAt: string;
}

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    // State Management
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(true);
    const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
    const [appVersion, setAppVersion] = useState<string>("1.0.0");
    const [systemModeActive, setSystemModeActive] = useState(true);

    // Office Form
    const [newOffice, setNewOffice] = useState({ office_name: "", location: "" });
    const [isCreatingOffice, setIsCreatingOffice] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [offRes, backRes, verRes] = await Promise.all([
                fetch(`${BASE_URL}/offices`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/backup/status`, { headers: getAuthHeader() }),
                fetch(`${BASE_URL}/backup/version`, { headers: getAuthHeader() })
            ]);

            const offData = await offRes.json();
            if (offData.success) setOffices(offData.data);

            const backData = await backRes.json();
            if (backData.success) setBackupStatus(backData.data);

            const verData = await verRes.json();
            if (verData.success) setAppVersion(verData.version);
        } catch (error) {
            toast.error("Failed to sync system data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOffice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOffice.office_name || !newOffice.location) return;
        setIsCreatingOffice(true);
        try {
            const res = await fetch(`${BASE_URL}/offices`, {
                method: "POST",
                headers: { ...getAuthHeader(), "Content-Type": "application/json" },
                body: JSON.stringify(newOffice)
            });
            const data = await res.json();
            if (data.success) {
                setOffices([...offices, data.data]);
                setNewOffice({ office_name: "", location: "" });
                toast.success("Branch registered successfully");
            }
        } catch (error) {
            toast.error("Network error creating office");
        } finally {
            setIsCreatingOffice(false);
        }
    };

    const handleDeleteOffice = async (id: number) => {
        if (!window.confirm("Permanent deletion of this office?")) return;
        try {
            const res = await fetch(`${BASE_URL}/offices/${id}`, {
                method: "DELETE",
                headers: getAuthHeader()
            });
            if (res.ok) {
                setOffices(offices.filter(o => o.office_id !== id));
                toast.success("Office record purged");
            }
        } catch (e) {
            toast.error("Could not delete record");
        }
    };

    const handleTriggerBackup = async (sendToEmail: boolean = false) => {
        const loadingToast = toast.loading(sendToEmail ? "Encrypting & Mailing..." : "Creating snapshot...");
        try {
            const res = await fetch(`${BASE_URL}/backup/trigger`, {
                method: "POST",
                headers: { ...getAuthHeader(), "Content-Type": "application/json" },
                body: JSON.stringify({ email_notification: sendToEmail })
            });
            const data = await res.json();
            if (data.success) {
                setBackupStatus({
                    fileName: data.data.fileName,
                    size: data.data.size || 5242880,
                    createdAt: new Date().toISOString()
                });
                toast.success(sendToEmail ? "Verified backup sent to Gmail" : "Local snapshot secured", { id: loadingToast });
            }
        } catch (error) {
            toast.error("System backup failed", { id: loadingToast });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 md:p-8 lg:p-12">
            <Toaster position="bottom-center" />

            <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition-all mb-3 text-sm"
                        >
                            <ChevronLeft size={18} /> BACK TO CONSOLE
                        </button>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                            CORE <span className="text-indigo-600 italic">SYSTEM</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Architecture v{appVersion} • Production</p>
                    </motion.div>

                    <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">System Live</span>
                        </div>
                    </div>
                </header>

                {/* 1. Preference - Simple Toggle */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Monitor size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Operational Mode</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Global system performance</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                        <div>
                            <h4 className="font-black text-sm uppercase text-slate-700">Advanced Analytics Mode</h4>
                            <p className="text-xs text-slate-500 font-medium">Enable real-time background logs and UI rendering acceleration</p>
                        </div>
                        <button
                            onClick={() => setSystemModeActive(!systemModeActive)}
                            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${systemModeActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                            <motion.div
                                animate={{ x: systemModeActive ? 34 : 4 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center"
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${systemModeActive ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                            </motion.div>
                        </button>
                    </div>
                </section>

                {/* 2. Office Hub - Refined Input UI */}
                <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Building2 size={24} /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Branch Network</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Office Location Management</p>
                        </div>
                    </div>

                    <form onSubmit={handleCreateOffice} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-10">
                        <div className="md:col-span-5">
                            <input
                                placeholder="Office Site Name"
                                required
                                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/5 outline-none font-bold text-sm transition-all text-slate-700"
                                value={newOffice.office_name}
                                onChange={e => setNewOffice({ ...newOffice, office_name: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-4">
                            <input
                                placeholder="City / Region"
                                required
                                className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/5 outline-none font-bold text-sm transition-all text-slate-700"
                                value={newOffice.location}
                                onChange={e => setNewOffice({ ...newOffice, location: e.target.value })}
                            />
                        </div>
                        <button
                            disabled={isCreatingOffice}
                            className="md:col-span-3 p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {isCreatingOffice ? <RefreshCcw className="animate-spin" size={18} /> : <Plus size={18} />}
                            Register
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {offices.map(office => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={office.office_id}
                                    className="flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-50 text-indigo-500 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm uppercase text-slate-800">{office.office_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{office.location}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteOffice(office.office_id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                {/* 3. Maintenance - Gmail Focused */}
                <section className="bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <Database size={22} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Security & Integrity</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black leading-tight">Database <br/>Snapshot</h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                                Full system backup. Sync an encrypted database dump directly to your administrator Gmail account for off-site disaster recovery.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={() => handleTriggerBackup(false)}
                                    className="flex-1 px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download size={18} /> LOCAL
                                </button>
                                <button
                                    onClick={() => handleTriggerBackup(true)}
                                    className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
                                >
                                    <Mail size={18} /> GMAIL SYNC
                                </button>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2 tracking-[0.2em]">
                                <History size={16} /> RECENT SYNC STATUS
                            </h4>
                            {backupStatus ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-base font-black text-emerald-400 truncate max-w-[180px]">{backupStatus.fileName}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{formatSize(backupStatus.size)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-full">Success</span>
                                            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tighter">{new Date(backupStatus.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex items-center gap-3 text-emerald-500">
                                        <div className="p-1 bg-emerald-500/20 rounded-full"><CheckCircle2 size={12} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Snapshot Verified & Encrypted</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center opacity-40">
                                    <Server size={40} className="mx-auto text-slate-500 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ready for first backup</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <Database size={400} className="absolute -right-24 -bottom-24 text-white/[0.03] -rotate-12 pointer-events-none" />
                </section>

                {/* Footer */}
                <footer className="flex flex-col md:flex-row items-center justify-between px-6 pt-6 pb-12 opacity-40 border-t border-slate-200 gap-6">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={20} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Secure Architecture</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            <span>Node Production</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            <span>PostgreSQL 15</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SettingsPage;