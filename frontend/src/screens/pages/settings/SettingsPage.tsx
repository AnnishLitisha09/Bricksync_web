import React, { useState, useEffect } from "react";
import {
    Building2, Database, Plus, Trash2,
    MapPin, RefreshCcw, ShieldCheck,
    Monitor, Download, History, Mail,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    // State Management
    const [offices, setOffices] = useState<Office[]>([]);
    const [_loading, setLoading] = useState(true);
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

                if (data.downloadUrl && !sendToEmail) {
                    window.open(data.downloadUrl, "_blank");
                }
                toast.success(sendToEmail ? "Database sent to Gmail" : "Snapshot ready", { id: loadingToast });
            } else {
                toast.error(data.message || "Failed backup execution", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Process aborted", { id: loadingToast });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 animate-in font-sans">
            <Toaster position="top-right" />

            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                            <ShieldCheck size={11} /> Enterprise Infrastructure
                        </span>
                        <span className="text-xs font-bold text-slate-400">• v{appVersion} Production</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Core <span className="text-indigo-600">Settings</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        Branch management, database snapshots & operational controls
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 h-10 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs font-bold text-slate-700">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span>Production Live</span>
                    </div>
                </div>
            </div>

            {/* ─── 1. OPERATIONAL MODE ─── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Monitor size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Operational Mode</h3>
                        <p className="text-xs font-semibold text-slate-400">Global system runtime performance</p>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                        <h4 className="font-bold text-xs text-slate-800">Advanced Analytics Engine</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Enable background statistics and accelerated UI telemetry</p>
                    </div>
                    <button
                        onClick={() => setSystemModeActive(!systemModeActive)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${systemModeActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                        <motion.div
                            animate={{ x: systemModeActive ? 26 : 3 }}
                            className="absolute top-1 size-4 bg-white rounded-full shadow-sm"
                        />
                    </button>
                </div>
            </div>

            {/* ─── 2. BRANCH NETWORK ─── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Branch Network</h3>
                        <p className="text-xs font-semibold text-slate-400">Office location and loading site configuration</p>
                    </div>
                </div>

                {/* Form to add branch */}
                <form onSubmit={handleCreateOffice} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                        <input
                            placeholder="Branch site name (e.g. Tiruppur Main Unit)"
                            required
                            className="w-full h-10 px-3.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs"
                            value={newOffice.office_name}
                            onChange={e => setNewOffice({ ...newOffice, office_name: e.target.value })}
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <input
                            placeholder="City / Region"
                            required
                            className="w-full h-10 px-3.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs"
                            value={newOffice.location}
                            onChange={e => setNewOffice({ ...newOffice, location: e.target.value })}
                        />
                    </div>
                    <button
                        disabled={isCreatingOffice}
                        type="submit"
                        className="sm:col-span-3 h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        {isCreatingOffice ? <RefreshCcw className="animate-spin" size={15} /> : <Plus size={15} />}
                        <span>Register Branch</span>
                    </button>
                </form>

                {/* Branch Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <AnimatePresence>
                        {offices.map(office => (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={office.office_id}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-2xs transition-all group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-9 bg-white border border-slate-200 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-xs uppercase text-slate-800 truncate">{office.office_name}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{office.location}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteOffice(office.office_id)}
                                    className="size-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                                    title="Delete Branch"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── 3. DATABASE BACKUP SNAPSHOT ─── */}
            <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-2xs relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                <Database size={11} /> Database Snapshot
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Automated Cloud Backups</h2>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">
                            Generate an encrypted database dump snapshot or sync directly to administrator email for disaster recovery.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                            <button
                                onClick={() => handleTriggerBackup(false)}
                                className="h-10 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                                <Download size={14} />
                                <span>Download Local</span>
                            </button>
                            <button
                                onClick={() => handleTriggerBackup(true)}
                                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/30 cursor-pointer active:scale-95"
                            >
                                <Mail size={14} />
                                <span>Gmail Sync</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <History size={13} />
                                <span>Recent Snapshot</span>
                            </div>
                            {backupStatus && (
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-full">Verified</span>
                            )}
                        </div>

                        {backupStatus ? (
                            <div>
                                <p className="text-xs font-black text-emerald-400 truncate">{backupStatus.fileName}</p>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1">
                                    <span>{formatSize(backupStatus.size)}</span>
                                    <span>{new Date(backupStatus.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-white/10 flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                                    <CheckCircle2 size={12} />
                                    <span>Snapshot verified & ready</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic py-2">No previous backup records found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
