import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Phone,
    IndianRupee,
    Briefcase,
    ChevronRight,
    Loader2,
    X,
    Truck,
    Cpu,
    Edit2,
    Save,
    ShieldCheck,
    Users
} from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import toast from "react-hot-toast";

interface OrderDetail {
    date: string;
    product: string;
    qty: number;
    amount: string;
}

interface StaffSalary {
    id: number;
    name: string;
    phone: string;
    totalSalary: string;
    loader: {
        total: string;
        details: OrderDetail[];
    };
    driver: {
        total: string;
        rate: number;
        details: { date: string; amount: string; type: string; session?: string; rate?: number }[];
        trips?: { date: string; product: string; qty: number; orderId?: number }[];
    };
    operator: {
        total: string;
        details: { date: string; amount: string; qty: number }[];
    };
}

const SalaryPage: React.FC = () => {
    const [staffData, setStaffData] = useState<StaffSalary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<StaffSalary | null>(null);
    const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);
    const [globalRate, setGlobalRate] = useState<number>(0);
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [newRate, setNewRate] = useState<string>("");

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/salary/weekly-overview`, {
                headers: getAuthHeader()
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                toast.error(errData.message || "Failed to load salaries");
                return;
            }
            const data = await response.json();
            if (data.success) {
                setStaffData(data.data || data.salaryData || []);
                setWeekRange(data.weekRange || null);
                setGlobalRate(data.globalDriverRate || 0);
                setNewRate(data.globalDriverRate?.toString() || "0");
            } else {
                toast.error(data.message || "Failed to load salaries");
            }
        } catch (error) {
            console.error("Payroll fetch error:", error);
            toast.error("Error connecting to payroll server");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGlobalRate = async () => {
        const rate = parseFloat(newRate);
        if (isNaN(rate) || rate < 0) {
            toast.error("Please enter a valid rate");
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/salary/global-rate`, {
                method: "POST",
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ rate, value: rate })
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Global driver rate updated");
                setIsEditingRate(false);
                fetchSalaries();
            } else {
                toast.error(data.message || "Failed to update global rate");
            }
        } catch (error) {
            toast.error("Failed to update global rate");
        }
    };

    const filteredStaff = staffData.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    const totalPayout = staffData.reduce((sum, s) => sum + parseFloat(s.totalSalary), 0);

    const formatDateRange = () => {
        if (!weekRange) return "Current Week";
        const start = new Date(weekRange.start);
        const end = new Date(weekRange.end);
        return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    };

    return (
        <div className="space-y-6 animate-in font-sans">
            {/* ─── HEADER ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
                            <ShieldCheck size={11} /> Payroll Engine
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                            • {formatDateRange()}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Staff <span className="text-indigo-600">Salaries</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500">
                        Weekly wage calculations, role earnings & payroll settlement
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-72 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                    <input
                        type="text"
                        placeholder="Search staff by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                </div>
            </div>

            {/* ─── STAT CARDS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Staff */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Staff</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{staffData.length}</p>
                    </div>
                    <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                        <Users size={18} />
                    </div>
                </div>

                {/* Total Weekly Payout */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Weekly Payout</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">
                            ₹{totalPayout.toLocaleString()}
                        </p>
                    </div>
                    <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                        <IndianRupee size={18} />
                    </div>
                </div>

                {/* Global Driver Rate */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Global Driver Rate</p>
                            {isEditingRate ? (
                                <button onClick={handleUpdateGlobalRate} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer" title="Save Rate">
                                    <Save size={13} />
                                </button>
                            ) : (
                                <button onClick={() => setIsEditingRate(true)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer" title="Edit Rate">
                                    <Edit2 size={13} />
                                </button>
                            )}
                        </div>
                        {isEditingRate ? (
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-sm font-bold text-slate-400">₹</span>
                                <input
                                    type="number"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="w-24 h-8 bg-slate-50 border border-indigo-500 rounded-lg px-2 font-black text-base outline-none"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <p className="text-2xl font-black text-slate-900 mt-1">₹{globalRate.toLocaleString()}.00</p>
                        )}
                    </div>
                    <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                        <Truck size={18} />
                    </div>
                </div>
            </div>

            {/* ─── STAFF LIST ─── */}
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-3">
                        <Loader2 className="size-10 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Payroll Records...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStaff.map((staff, idx) => (
                            <motion.div
                                key={staff.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.03, 0.25) }}
                                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all p-4 flex flex-col justify-between"
                            >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                                                {staff.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight" title={staff.name}>
                                                    {staff.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-0.5">
                                                    <Phone size={11} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{staff.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Roles Breakdown */}
                                    <div className="py-3 space-y-1.5">
                                        {parseFloat(staff.loader.total) > 0 && (
                                            <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100/80 text-xs font-bold">
                                                <span className="text-slate-600 text-[11px]">As Loader</span>
                                                <span className="text-emerald-700 font-extrabold">₹{staff.loader.total}</span>
                                            </div>
                                        )}
                                        {parseFloat(staff.driver.total) > 0 && (
                                            <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100/80 text-xs font-bold">
                                                <span className="text-slate-600 text-[11px]">As Driver</span>
                                                <span className="text-blue-700 font-extrabold">₹{staff.driver.total}</span>
                                            </div>
                                        )}
                                        {parseFloat(staff.operator.total) > 0 && (
                                            <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-amber-100/80 text-xs font-bold">
                                                <span className="text-slate-600 text-[11px]">As Operator</span>
                                                <span className="text-amber-700 font-extrabold">₹{staff.operator.total}</span>
                                            </div>
                                        )}
                                        {parseFloat(staff.loader.total) === 0 && parseFloat(staff.driver.total) === 0 && parseFloat(staff.operator.total) === 0 && (
                                            <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-400 italic">
                                                No duties logged for this period
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Earnings Box */}
                                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Total Weekly Earnings</p>
                                            <p className="text-xl font-black text-indigo-900 mt-0.5">₹{parseFloat(staff.totalSalary).toLocaleString()}</p>
                                        </div>
                                        <div className="size-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                                            <IndianRupee size={15} />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Breakdown Button */}
                                <div className="pt-3">
                                    <button
                                        onClick={() => setSelectedStaff(staff)}
                                        className="h-9 w-full bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200/80 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group/btn"
                                    >
                                        <span>Detailed Breakdown</span>
                                        <ChevronRight size={13} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── DETAILS MODAL ─── */}
            {typeof document !== "undefined" && createPortal(
                <AnimatePresence>
                    {selectedStaff && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                key="salary-modal"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200/80 my-auto"
                            >
                                <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 shrink-0">
                                    <div className="flex items-center gap-3.5">
                                        <div className="size-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs">
                                            {selectedStaff.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedStaff.name}</h2>
                                            <p className="text-xs font-bold text-slate-400">{formatDateRange()} • {selectedStaff.phone}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedStaff(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
                                {/* LOADER SECTION */}
                                {selectedStaff.loader.details.length > 0 && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={15} className="text-emerald-600" />
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Loader Assignments</h3>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product</th>
                                                        <th className="px-4 py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Qty</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Earning</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs">
                                                    {selectedStaff.loader.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-800 uppercase">{item.product}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{item.qty}</td>
                                                            <td className="px-4 py-3 text-right font-black text-emerald-600">₹{item.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DRIVER SECTION */}
                                {selectedStaff.driver.details.length > 0 && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <Truck size={15} className="text-blue-600" />
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Driver Attendance & Duty Logs</h3>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Session / Duty</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Daily Rate</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Earning</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs">
                                                    {selectedStaff.driver.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="font-bold text-slate-700 uppercase">{item.type}</span>
                                                                    {item.session && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">{item.session}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-semibold text-slate-500">
                                                                ₹{item.rate || selectedStaff.driver.rate}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-black text-blue-600">
                                                                ₹{item.amount}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DRIVER TRIPS SECTION */}
                                {selectedStaff.driver.trips && selectedStaff.driver.trips.length > 0 && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Truck size={15} className="text-indigo-600" />
                                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Delivery Trips Driven</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {selectedStaff.driver.trips.length} {selectedStaff.driver.trips.length === 1 ? "Trip" : "Trips"} • Included in Daily Shift Wage
                                            </span>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Product / Material</th>
                                                        <th className="px-4 py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Qty</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Trip Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs">
                                                    {selectedStaff.driver.trips.map((trip, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-600">{new Date(trip.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 font-bold text-slate-800 uppercase">{trip.product}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{trip.qty}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    Completed
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* OPERATOR SECTION */}
                                {selectedStaff.operator.details.length > 0 && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={15} className="text-amber-600" />
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Operator Production Logs</h3>
                                        </div>
                                        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Stocks</th>
                                                        <th className="px-4 py-2.5 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Earning Share</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-xs">
                                                    {selectedStaff.operator.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-semibold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-slate-600">{item.qty}</td>
                                                            <td className="px-4 py-3 text-right font-black text-amber-600">₹{item.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cumulative Weekly Earnings</p>
                                    <p className="text-2xl font-black text-indigo-600 tracking-tight">₹{parseFloat(selectedStaff.totalSalary).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedStaff(null)}
                                    className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs"
                                >
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            document.body
        )}
        </div>
    );
};

export default SalaryPage;
