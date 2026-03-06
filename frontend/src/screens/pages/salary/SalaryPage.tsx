import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Wallet,
    Search,
    Phone,
    IndianRupee,
    Briefcase,
    ChevronRight,
    Loader2
} from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import toast from "react-hot-toast";

interface LoaderSalary {
    id: number;
    name: string;
    phone: string;
    totalSalary: string;
    assignmentCount: number;
}

const SalaryPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [loaders, setLoaders] = useState<LoaderSalary[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchSalaries();
    }, []);

    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/salary/loaders`, {
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (data.success) {
                setLoaders(data.data);
            } else {
                toast.error("Failed to load salaries");
            }
        } catch (error) {
            console.error("Error fetching salaries:", error);
            toast.error("Error connecting to server");
        } finally {
            setLoading(false);
        }
    };

    const filteredLoaders = loaders.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm)
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8"
        >
            {/* HEADER */}
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Wallet className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
                            Staff <span className="text-indigo-600">Salaries</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] pl-1">
                        Loader Earnings & Performance
                    </p>
                </div>

                <div className="relative group w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search loaders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-600"
                    />
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Loaders</p>
                    <p className="text-3xl font-black text-slate-900">{loaders.length}</p>
                </div>
                <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-3 text-white/70">Total Payout Due</p>
                    <p className="text-3xl font-black text-white">
                        ₹{loaders.reduce((sum, l) => sum + parseFloat(l.totalSalary), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Assignments</p>
                    <p className="text-3xl font-black text-slate-900">
                        {loaders.reduce((sum, l) => sum + l.assignmentCount, 0)}
                    </p>
                </div>
            </div>

            {/* LOADER LIST */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Calculating Salaries...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLoaders.map((loader, idx) => (
                            <motion.div
                                key={loader.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50" />

                                <div className="relative">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                            {loader.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 uppercase tracking-tight">{loader.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Phone size={10} />
                                                <span className="text-[9px] font-bold tracking-widest">{loader.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignments</span>
                                            </div>
                                            <span className="font-black text-slate-900">{loader.assignmentCount}</span>
                                        </div>

                                        <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-lg shadow-slate-200 group-hover:bg-indigo-600 group-hover:shadow-indigo-100 transition-all">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 group-hover:text-white/70">Total Earnings</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl font-black">₹{parseFloat(loader.totalSalary).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                                    <IndianRupee size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                                        View Details <ChevronRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {filteredLoaders.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 italic">
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No loaders matching search</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SalaryPage;
