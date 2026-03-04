import React, { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock4,
    Save,
    ChevronLeft,
    Calendar,
    UserCheck,
    Search,
    Check,
    User,
    Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAttendanceStore } from "../../../store/useAttendanceStore";
import { FILE_BASE_URL } from "../../../api/base";
import LottieLoader from "../../../components/common/LottieLoader";

const DailyAttendance: React.FC = () => {
    const navigate = useNavigate();
    const { attendance, loading, saving, fetchAttendance, toggleAttendance, saveAllAttendance, selectedDate, setSelectedDate } = useAttendanceStore();
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchAttendance(true);
    }, [selectedDate, fetchAttendance]);

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="p-4 md:p-8 lg:p-12 min-h-screen bg-[#F8FAFC] space-y-8 font-sans max-w-[1400px] mx-auto overflow-x-hidden">

            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate("/staff")}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest transition-all group"
                    >
                        <div className="p-1.5 rounded-lg bg-white border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all shadow-sm">
                            <ChevronLeft size={14} />
                        </div>
                        Back to Personnel Hub
                    </motion.button>
                    <div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                            Daily <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Attendance</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-4 text-slate-500 font-bold bg-white w-fit px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                            <Calendar size={18} className="text-indigo-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs uppercase tracking-wider font-extrabold cursor-pointer text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveAll}
                        disabled={saving || loading}
                        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl shadow-xl transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 ${saving ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200/50'}`}
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {saving ? "Syncing..." : "Save Changes"}
                    </motion.button>
                </div>
            </div>

            {/* --- Filters & Search --- */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col lg:flex-row items-center gap-4"
            >
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search personnel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-16 pr-6 py-4 rounded-2xl border border-slate-100 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300 bg-slate-50/50 focus:bg-white"
                    />
                </div>
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-900 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200/50 w-full lg:w-auto justify-center">
                    <UserCheck size={18} className="text-indigo-400" />
                    {attendance.length} Total Staff
                </div>
            </motion.div>

            {/* --- Content Section --- */}
            <div className="min-h-[400px]">
                {loading ? (
                    <LottieLoader
                        type="general"
                        message="Synchronizing Personnel Roster"
                        size={250}
                    />
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        layout
                    >
                        {filteredAttendance.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Matching Records</h3>
                                <p className="text-slate-400 font-medium mt-1">Refine your search parameters to locate personnel.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop/Tablet Table View */}
                                <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/10">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest pl-10">Personnel</th>
                                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">FN</th>
                                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">AN</th>
                                                    <th className="p-8 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                <AnimatePresence mode="popLayout">
                                                    {filteredAttendance.map((staff) => (
                                                        <AttendanceRow key={staff.userid} staff={staff} toggleAttendance={toggleAttendance} variants={itemVariants} />
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    <AnimatePresence mode="popLayout">
                                        {filteredAttendance.map((staff) => (
                                            <AttendanceCard key={staff.userid} staff={staff} toggleAttendance={toggleAttendance} variants={itemVariants} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </div>

            {/* --- Insight/Footer --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                {[
                    { icon: <CheckCircle2 size={24} />, title: "Precision Logging", text: "Mark individual shifts accurately for payroll automated calculation.", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { icon: <Clock4 size={24} />, title: "Real-time Sync", text: "All changes are instantly synchronized with the central cloud database.", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: <UserCheck size={24} />, title: "Identity Guard", text: "Attendance is verified through unique personnel identification IDs.", color: "text-amber-600", bg: "bg-amber-50" }
                ].map((item, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={i}
                        className="p-6 md:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} mb-6 group-hover:scale-110 transition-transform`}>
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

/* --- Helper Components --- */

interface StaffMember {
    userid: number;
    name: string;
    imageUrl?: string;
    forenoon: boolean;
    afternoon: boolean;
}

interface ComponentProps {
    staff: StaffMember;
    toggleAttendance: (userid: number, field: "forenoon" | "afternoon") => void;
    variants: any;
}

const AttendanceRow = ({ staff, toggleAttendance, variants }: ComponentProps) => {
    const isFN = staff.forenoon;
    const isAN = staff.afternoon;
    const { label, colorStyles } = getStatusDetails(isFN, isAN);

    return (
        <motion.tr variants={variants} className="hover:bg-slate-50/50 transition-all group">
            <td className="p-6 pl-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-slate-100 bg-slate-50 relative">
                        {staff.imageUrl ? (
                            <img src={`${FILE_BASE_URL}${staff.imageUrl}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                                <User size={20} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate">{staff.name}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ID: #{staff.userid}</p>
                    </div>
                </div>
            </td>
            <td className="p-6">
                <CustomCheckbox active={isFN} onClick={() => toggleAttendance(staff.userid, 'forenoon')} />
            </td>
            <td className="p-6">
                <CustomCheckbox active={isAN} onClick={() => toggleAttendance(staff.userid, 'afternoon')} />
            </td>
            <td className="p-6 text-center">
                <div className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${colorStyles}`}>
                    {label}
                </div>
            </td>
        </motion.tr>
    );
};

const AttendanceCard = ({ staff, toggleAttendance, variants }: ComponentProps) => {
    const isFN = staff.forenoon;
    const isAN = staff.afternoon;
    const { label, colorStyles } = getStatusDetails(isFN, isAN);

    return (
        <motion.div variants={variants} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-slate-100 bg-slate-50">
                    {staff.imageUrl ? (
                        <img src={`${FILE_BASE_URL}${staff.imageUrl}`} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-400">
                            <User size={20} />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{staff.name}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">ID: #{staff.userid}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${colorStyles}`}>
                    {label}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Shift: FN</p>
                    <div className="flex justify-center">
                        <CustomCheckbox active={isFN} onClick={() => toggleAttendance(staff.userid, 'forenoon')} />
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Shift: AN</p>
                    <div className="flex justify-center">
                        <CustomCheckbox active={isAN} onClick={() => toggleAttendance(staff.userid, 'afternoon')} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const CustomCheckbox = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 mx-auto ${active
            ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-200"
            : "bg-slate-50 border-slate-100 text-slate-200 hover:border-indigo-200 hover:bg-white"
            }`}
    >
        <AnimatePresence mode="wait">
            {active ? (
                <motion.div
                    key="checked"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                >
                    <Check size={28} strokeWidth={3} />
                </motion.div>
            ) : (
                <motion.div
                    key="unchecked"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="w-2.5 h-2.5 rounded-full bg-slate-200"
                />
            )}
        </AnimatePresence>
    </motion.button>
);

const getStatusDetails = (fn: boolean, an: boolean) => {
    if (fn && an) return { label: "Full Present", colorStyles: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    if (fn || an) return { label: "Half Shift", colorStyles: "bg-amber-50 text-amber-600 border-amber-100" };
    return { label: "Absent", colorStyles: "bg-rose-50 text-rose-600 border-rose-100" };
};

export default DailyAttendance;
