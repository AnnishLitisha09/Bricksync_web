import React, { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock4,
    Save,
    ChevronLeft,
    Calendar,
    UserCheck,
    Search,
    Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAttendanceStore } from "../../../store/useAttendanceStore";
import { FILE_BASE_URL } from "../../../api/base";

const DailyAttendance: React.FC = () => {
    const navigate = useNavigate();
    const { attendance, loading, saving, fetchAttendance, toggleAttendance, saveAllAttendance } = useAttendanceStore();
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchAttendance();
    }, []);

    const handleSaveAll = async () => {
        try {
            await saveAllAttendance();
            toast.success("All attendance records saved and synced!");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Sync Failure: Some records could not be persisted.");
        }
    };

    const filteredAttendance = attendance.filter(staff =>
        staff.name.toLowerCase().includes(search.toLowerCase()) ||
        staff.userid.toString().includes(search)
    );

    return (
        <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 font-sans max-w-[1400px] mx-auto overflow-hidden">

            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate("/staff")}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all group"
                    >
                        <div className="p-1 rounded-md bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                            <ChevronLeft size={14} />
                        </div>
                        Back to Personnel Hub
                    </motion.button>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                            Daily <span className="text-indigo-600">Attendance</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-4 text-slate-500 font-bold bg-white w-fit px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                            <Calendar size={18} className="text-indigo-500" />
                            <span className="text-xs uppercase tracking-wider">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveAll}
                    disabled={saving || loading}
                    className={`flex items-center justify-center gap-4 px-10 py-5 rounded-[2rem] shadow-2xl transition-all font-black text-sm uppercase tracking-widest disabled:opacity-50 ${saving ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'}`}
                >
                    {saving ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                        <Save size={20} className="text-indigo-400" />
                    )}
                    {saving ? "Synchronizing..." : "Save All Changes"}
                </motion.button>
            </div>

            {/* --- Filters & Search --- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-center gap-4"
            >
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or employee ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 rounded-2xl border border-slate-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 shadow-inner bg-slate-50/50 focus:bg-white"
                    />
                </div>
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 rounded-[1.8rem] text-white font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-slate-200 flex-shrink-0">
                    <UserCheck size={18} className="text-indigo-400" />
                    {attendance.length} Total Registered Staff
                </div>
            </motion.div>

            {/* --- Main Attendance Table --- */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
                className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl shadow-indigo-500/5"
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Personnel Roster</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-10">Personnel Identification</th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Forenoon (FN)</th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Afternoon (AN)</th>
                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Attendance Matrix</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                <AnimatePresence mode="popLayout">
                                    {filteredAttendance.length === 0 ? (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <td colSpan={4} className="p-24 text-center">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                                        <Search size={32} className="text-slate-200" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Matching Records</h3>
                                                        <p className="text-slate-400 font-medium mt-1">Refine your search parameters to locate personnel.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ) : (
                                        filteredAttendance.map((staff) => {
                                            const isFN = staff.forenoon;
                                            const isAN = staff.afternoon;
                                            let statusLabel = "Absent";
                                            let statusColor = "text-red-600 bg-red-50 border-red-100 shadow-red-500/10";
                                            if (isFN && isAN) {
                                                statusLabel = "Full Day Present";
                                                statusColor = "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-500/10";
                                            } else if (isFN || isAN) {
                                                statusLabel = "Half Day Marked";
                                                statusColor = "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/10";
                                            }
                                            return (
                                                <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={staff.userid} className="hover:bg-indigo-50/20 transition-all group">
                                                    <td className="p-8 pl-10">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-slate-50 bg-slate-100 group-hover:ring-indigo-100 transition-all shadow-inner flex-shrink-0">
                                                                {staff.imageUrl ? (
                                                                    <img src={`${FILE_BASE_URL}${staff.imageUrl}`} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100 uppercase font-black">{staff.name.charAt(0)}</div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-base">{staff.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Personnel ID: #{staff.userid}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleAttendance(staff.userid, 'forenoon')}
                                                            className={`mx-auto flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all ${isFN ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-400 hover:bg-white'}`}>
                                                            {isFN ? <Check size={28} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                                                        </motion.button>
                                                    </td>
                                                    <td className="p-8">
                                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => toggleAttendance(staff.userid, 'afternoon')}
                                                            className={`mx-auto flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all ${isAN ? 'bg-emerald-500 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-slate-50 border-slate-100 text-slate-300 hover:border-emerald-200 hover:text-emerald-400 hover:bg-white'}`}>
                                                            {isAN ? <Check size={28} strokeWidth={3} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                                                        </motion.button>
                                                    </td>
                                                    <td className="p-8 text-center min-w-[200px]">
                                                        <motion.div layout className={`inline-block px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all ${statusColor}`}>
                                                            {statusLabel}
                                                        </motion.div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* --- Insight/Footer --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                {[
                    { icon: <CheckCircle2 size={24} />, title: "Precision Logging", text: "Mark individual shifts accurately. The system automatically calculates daily wages based on these logs.", color: "indigo" },
                    { icon: <Clock4 size={24} />, title: "Real-time Sync", text: "All changes made here are reflected live in the Personnel Management and Payroll modules.", color: "emerald" },
                    { icon: <UserCheck size={24} />, title: "Profile Security", text: "Identity verification is performed for each member marked present to ensure zero fraud.", color: "slate" }
                ].map((item, i) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={i}
                        className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/10 group hover:border-indigo-100 transition-colors">
                        <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <h3 className="font-black text-slate-900 text-sm mb-2 uppercase tracking-tight">{item.title}</h3>
                        <p className="text-slate-400 text-xs font-semibold leading-relaxed">{item.text}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default DailyAttendance;
