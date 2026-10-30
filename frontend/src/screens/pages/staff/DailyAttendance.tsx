import React, { useEffect, useState } from "react";
import {
    Save,
    ChevronLeft,
    Calendar,
    Search,
    Check,
    Loader2,
    CheckCheck,
    X,
    Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAttendanceStore } from "../../../store/useAttendanceStore";
import { FILE_BASE_URL } from "../../../api/base";

const DailyAttendance: React.FC = () => {
    const navigate = useNavigate();
    const {
        attendance,
        loading,
        saving,
        fetchAttendance,
        toggleAttendance,
        setAllAttendance,
        saveAllAttendance,
        selectedDate,
        setSelectedDate
    } = useAttendanceStore();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "full" | "half" | "absent">("all");

    useEffect(() => {
        fetchAttendance(true);
    }, [selectedDate, fetchAttendance]);

    const handleSaveAll = async () => {
        try {
            await saveAllAttendance();
            toast.success("Attendance records saved and synced!");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to persist attendance records.");
        }
    };

    const handleMarkAllPresent = () => {
        setAllAttendance("both", true);
        toast.success("Marked all staff as Full Present");
    };

    const handleClearAll = () => {
        setAllAttendance("both", false);
        toast.success("Reset all staff attendance");
    };

    const filteredAttendance = attendance.filter(staff => {
        const matchesSearch =
            staff.name.toLowerCase().includes(search.toLowerCase()) ||
            staff.userid.toString().includes(search);

        if (!matchesSearch) return false;

        const isFull = staff.forenoon && staff.afternoon;
        const isHalf = (staff.forenoon && !staff.afternoon) || (!staff.forenoon && staff.afternoon);
        const isAbsent = !staff.forenoon && !staff.afternoon;

        if (statusFilter === "full") return isFull;
        if (statusFilter === "half") return isHalf;
        if (statusFilter === "absent") return isAbsent;
        return true;
    });

    const fullCount = attendance.filter(s => s.forenoon && s.afternoon).length;
    const halfCount = attendance.filter(s => (s.forenoon && !s.afternoon) || (!s.forenoon && s.afternoon)).length;
    const absentCount = attendance.filter(s => !s.forenoon && !s.afternoon).length;

    return (
        <div className="space-y-6 animate-in font-sans">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/staff")}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={12} /> Personnel Hub
                        </button>
                        <span className="text-xs font-bold text-slate-400">• Daily Shift Roster</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Daily <span className="text-indigo-600">Attendance</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        Shift tracking (Forenoon & Afternoon) with automated payroll synchronization
                    </p>
                </div>

                {/* Date Picker + Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-white px-3 h-10 rounded-xl border border-slate-200/80 shadow-2xs">
                        <Calendar size={15} className="text-indigo-600 shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-extrabold uppercase tracking-wider cursor-pointer text-slate-700"
                        />
                    </div>

                    <button
                        onClick={handleMarkAllPresent}
                        type="button"
                        className="h-10 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="1-click mark all staff full present"
                    >
                        <CheckCheck size={14} />
                        <span className="hidden sm:inline">Mark All Present</span>
                        <span className="sm:hidden">All Present</span>
                    </button>

                    <button
                        onClick={handleClearAll}
                        type="button"
                        className="h-10 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Reset all"
                    >
                        <X size={14} />
                        <span className="hidden sm:inline">Reset</span>
                    </button>

                    <button
                        onClick={handleSaveAll}
                        disabled={saving || loading}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                </div>
            </div>

            {/* ─── QUICK METRICS & FILTER BAR ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                    onClick={() => setStatusFilter("all")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        statusFilter === "all"
                            ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/10 shadow-2xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Personnel</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">{attendance.length}</p>
                </button>

                <button
                    onClick={() => setStatusFilter("full")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        statusFilter === "full"
                            ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/10 shadow-2xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                >
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Full Present</p>
                    <p className="text-xl font-black text-emerald-700 mt-0.5">{fullCount}</p>
                </button>

                <button
                    onClick={() => setStatusFilter("half")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        statusFilter === "half"
                            ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/10 shadow-2xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                >
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Half Shift</p>
                    <p className="text-xl font-black text-amber-700 mt-0.5">{halfCount}</p>
                </button>

                <button
                    onClick={() => setStatusFilter("absent")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        statusFilter === "absent"
                            ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/10 shadow-2xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                    }`}
                >
                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Absent</p>
                    <p className="text-xl font-black text-rose-600 mt-0.5">{absentCount}</p>
                </button>
            </div>

            {/* ─── SEARCH BAR ─── */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                    <input
                        type="text"
                        placeholder="Search personnel by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-semibold text-xs text-slate-800 placeholder:text-slate-400 bg-white transition-all shadow-2xs"
                    />
                </div>
                <div className="flex items-center gap-2 px-3 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 font-bold text-xs shrink-0 w-full sm:w-auto justify-center">
                    <Filter size={13} className="text-indigo-600" />
                    <span>Showing {filteredAttendance.length} of {attendance.length}</span>
                </div>
            </div>

            {/* ─── ATTENDANCE TABLE ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <Loader2 className="size-9 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Personnel Roster...</p>
                    </div>
                ) : filteredAttendance.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <Search size={20} className="text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No Matching Personnel Found</h3>
                        <p className="text-xs text-slate-400 mt-1">Try modifying your search or status filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-3 px-4 sm:px-6">Personnel</th>
                                    <th className="py-3 px-4 text-center w-32">Forenoon (FN)</th>
                                    <th className="py-3 px-4 text-center w-32">Afternoon (AN)</th>
                                    <th className="py-3 px-4 text-center w-36">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAttendance.map((staff) => {
                                    const isFN = staff.forenoon;
                                    const isAN = staff.afternoon;
                                    const { label, badgeStyle } = getAttendanceStatus(isFN, isAN);

                                    return (
                                        <tr key={staff.userid} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Staff info */}
                                            <td className="py-3 px-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 shrink-0">
                                                        {staff.imageUrl ? (
                                                            <img
                                                                src={`${FILE_BASE_URL}${staff.imageUrl}`}
                                                                alt={staff.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 font-black text-xs">
                                                                {staff.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-tight truncate">
                                                            {staff.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider">
                                                            ID: #{staff.userid}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* FN Toggle */}
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAttendance(staff.userid, "forenoon")}
                                                    className={`inline-flex items-center justify-center size-9 rounded-xl border transition-all cursor-pointer ${
                                                        isFN
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                                                            : "bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"
                                                    }`}
                                                    title={`Toggle FN for ${staff.name}`}
                                                >
                                                    {isFN ? <Check size={16} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-slate-300" />}
                                                </button>
                                            </td>

                                            {/* AN Toggle */}
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAttendance(staff.userid, "afternoon")}
                                                    className={`inline-flex items-center justify-center size-9 rounded-xl border transition-all cursor-pointer ${
                                                        isAN
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs hover:bg-indigo-700"
                                                            : "bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400"
                                                    }`}
                                                    title={`Toggle AN for ${staff.name}`}
                                                >
                                                    {isAN ? <Check size={16} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-slate-300" />}
                                                </button>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                                                    {label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getAttendanceStatus = (fn: boolean, an: boolean) => {
    if (fn && an) {
        return {
            label: "Full Present",
            badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200"
        };
    }
    if (fn || an) {
        return {
            label: "Half Shift",
            badgeStyle: "bg-amber-50 text-amber-700 border-amber-200"
        };
    }
    return {
        label: "Absent",
        badgeStyle: "bg-rose-50 text-rose-700 border-rose-200"
    };
};

export default DailyAttendance;
