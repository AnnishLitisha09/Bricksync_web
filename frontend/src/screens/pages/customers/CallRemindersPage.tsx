import { useEffect, useState } from "react";
import { Phone, User, MessageSquare, ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchTodayCalls } from "../../../api/callLog";

export default function CallRemindersPage() {
    const navigate = useNavigate();
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCalls = async () => {
            try {
                const res = await fetchTodayCalls();
                setCalls(res.data || []);
            } catch (error) {
                console.error("Failed to fetch today's calls", error);
            } finally {
                setLoading(false);
            }
        };
        loadCalls();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-xl shadow-sm transition-all text-gray-600 hover:text-orange-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Today's Call Reminders</h1>
                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                            <Calendar size={14} className="text-orange-500" />
                            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold text-sm">
                        {calls.length} Reminders Pending
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-600 rounded-full"
                    />
                </div>
            ) : calls.length === 0 ? (
                <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Phone size={32} className="text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No Reminders for Today</h2>
                    <p className="text-gray-500">You're all caught up! There are no calls scheduled for today.</p>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {calls.map((call, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={call.id}
                            className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-orange-500/5 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                                    <User size={24} />
                                </div>
                                <a
                                    href={`tel:${call.customer?.phone_no}`}
                                    className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Phone size={20} />
                                </a>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-black text-gray-900 line-clamp-1">{call.customer?.name}</h3>
                                <p className="text-gray-500 font-bold text-sm">{call.customer?.phone_no}</p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 flex gap-3">
                                <MessageSquare size={18} className="text-gray-400 shrink-0 mt-1" />
                                <p className="text-sm text-gray-600 leading-relaxed italic">
                                    "{call.description || "No specific remark provided for this call."}"
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
