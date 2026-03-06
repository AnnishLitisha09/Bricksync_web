import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wallet,
    Search,
    Phone,
    IndianRupee,
    Briefcase,
    ChevronRight,
    Loader2,
    X,
    Calendar,
    Truck,
    Cpu,
    Edit2,
    Save
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
        count: number;
        details: OrderDetail[];
    };
    driver: {
        total: string;
        count: number;
        rate: number;
        details: any[];
    };
    operator: {
        total: string;
        count: number;
        details: any[];
    };
}

const SalaryPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [staffData, setStaffData] = useState<StaffSalary[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStaff, setSelectedStaff] = useState<StaffSalary | null>(null);
    const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);
    const [globalRate, setGlobalRate] = useState<number>(750);
    const [isEditingRate, setIsEditingRate] = useState(false);
    const [newRate, setNewRate] = useState("");

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/salary/weekly-overview`, {
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (data.success) {
                setStaffData(data.data);
                setWeekRange(data.weekRange);
                setGlobalRate(data.globalDriverRate);
                setNewRate(String(data.globalDriverRate));
            } else {
                toast.error("Failed to load salary overview");
            }
        } catch (error) {
            console.error("Error fetching salaries:", error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateGlobalRate = async () => {
        try {
            const response = await fetch(`${BASE_URL}/salary/settings/driver_daily_rate`, {
                method: "PUT",
                headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ value: newRate })
            });
            if (response.ok) {
                toast.success("Global rate updated");
                setIsEditingRate(false);
                fetchSalaries();
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8"
        >
            {/* HEADER */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
                            <Wallet className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                                Staff <span className="text-indigo-600">Salaries</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Calendar size={12} className="text-slate-400" />
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {formatDateRange()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-3xl py-4 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-600"
                    />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Staff</p>
                    <p className="text-4xl font-black text-slate-900">{staffData.length}</p>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200 group">
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">Total Weekly Payout</p>
                    <p className="text-4xl font-black text-white">
                        ₹{totalPayout.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Driver Rate</p>
                        {isEditingRate ? (
                            <button onClick={handleUpdateGlobalRate} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <Save size={14} />
                            </button>
                        ) : (
                            <button onClick={() => setIsEditingRate(true)} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                                <Edit2 size={14} />
                            </button>
                        )}
                    </div>
                    {isEditingRate ? (
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-slate-300">₹</span>
                            <input
                                type="number"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="w-32 bg-slate-50 border-b-2 border-indigo-600 font-black text-3xl outline-none"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <p className="text-4xl font-black text-indigo-600">₹{globalRate.toLocaleString()}.00</p>
                    )}
                </div>
            </div>

            {/* STAFF LIST */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.map((staff, idx) => (
                            <motion.div
                                key={staff.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                            >
                                <div className="relative">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{staff.name}</h3>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Phone size={10} />
                                                    <span className="text-[10px] font-bold tracking-widest">{staff.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        {parseFloat(staff.loader.total) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl">
                                                <span className="text-slate-400">As Loader</span>
                                                <span className="text-emerald-600">₹{staff.loader.total}</span>
                                            </div>
                                        )}
                                        {parseFloat(staff.driver.total) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl">
                                                <span className="text-slate-400">As Driver</span>
                                                <span className="text-blue-600">₹{staff.driver.total}</span>
                                            </div>
                                        )}
                                        {parseFloat(staff.operator.total) > 0 && (
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-xl">
                                                <span className="text-slate-400">As Operator</span>
                                                <span className="text-orange-600">₹{staff.operator.total}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-indigo-600 text-white rounded-[2rem] p-7 shadow-xl shadow-indigo-100 relative group-hover:bg-slate-900 transition-all duration-500">
                                        <div className="flex justify-between items-end relative">
                                            <div>
                                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Earnings</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl font-black italic">₹{parseFloat(staff.totalSalary).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                                                <IndianRupee size={22} className="text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedStaff(staff)}
                                        className="w-full mt-5 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100"
                                    >
                                        Detailed Breakdown <ChevronRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* DETAILS MODAL */}
            <AnimatePresence>
                {selectedStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg ring-4 ring-indigo-50">
                                        {selectedStaff.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedStaff.name}</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatDateRange()}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedStaff(null)} className="p-4 hover:bg-red-50 rounded-3xl text-slate-400 hover:text-red-500 transition-all">
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-12">
                                {/* LOADER SECTION */}
                                {selectedStaff.loader.details.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-6">
                                            <Briefcase size={16} className="text-emerald-500" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Loader Assignments</h3>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Earning</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedStaff.loader.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{item.product}</td>
                                                            <td className="px-6 py-4 text-center text-[10px] font-black text-slate-600">{item.qty}</td>
                                                            <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">₹{item.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* DRIVER SECTION */}
                                {selectedStaff.driver.details.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-6">
                                            <Truck size={16} className="text-blue-500" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Driver Attendance</h3>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Session</th>
                                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Rate</th>
                                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Earning</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedStaff.driver.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex gap-1">
                                                                    {item.forenoon && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded uppercase">FN</span>}
                                                                    {item.afternoon && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded uppercase">AN</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-xs font-bold text-slate-400">₹{selectedStaff.driver.rate}</td>
                                                            <td className="px-6 py-4 text-right text-sm font-black text-blue-600">₹{selectedStaff.driver.rate}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* OPERATOR SECTION */}
                                {selectedStaff.operator.details.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 px-6">
                                            <Cpu size={16} className="text-orange-500" />
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Operator Production Logs</h3>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Stocks</th>
                                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Earning Share</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedStaff.operator.details.map((item, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-center text-[10px] font-black text-slate-600">{item.qty}</td>
                                                            <td className="px-6 py-4 text-right text-sm font-black text-orange-600">₹{item.amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cumulative Weekly Earning</p>
                                    <p className="text-5xl font-black text-slate-900 tracking-tighter">₹{parseFloat(selectedStaff.totalSalary).toLocaleString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SalaryPage;
