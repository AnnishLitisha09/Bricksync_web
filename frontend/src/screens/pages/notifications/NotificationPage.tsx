import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ShieldAlert, Loader2, RefreshCcw, BellRing, ChevronRight, Calendar } from 'lucide-react';
import { BASE_URL, getAuthHeader } from '../../../api/base';
import toast from 'react-hot-toast';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'CALL' | 'VEHICLE';
    isRead: boolean;
    createdAt: string;
}

const NotificationPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/notifications`, {
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
            }
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
            toast.error("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: number) => {
        try {
            const response = await fetch(`${BASE_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                toast.success("Marked Read");
            }
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${BASE_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: getAuthHeader()
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                toast.success("All Marked Read");
            }
        } catch (error) {
            toast.error("Failed to update");
        }
    };

    const filteredNotifications = notifications.filter(n => filter === 'all' || !n.isRead);

    return (
        <div className="space-y-5 font-sans animate-in">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        System <span className="text-indigo-600">Notifications</span>
                    </h1>
                    <p className="text-slate-400 text-xs font-semibold">
                        {notifications.filter(n => !n.isRead).length} Unread Alerts & Security Dispatches
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={fetchNotifications}
                        className="h-10 px-3 bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center"
                        title="Refresh"
                    >
                        <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={markAllAsRead}
                        disabled={!notifications.some(n => !n.isRead)}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        <CheckCircle2 size={16} />
                        <span>Mark All Read</span>
                    </button>
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="flex items-center gap-2">
                {['all', 'unread'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all font-bold text-sm uppercase tracking-wider ${filter === f
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                            : "bg-white text-gray-700 border-gray-100 shadow-sm hover:border-indigo-200"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* NOTIFICATIONS LIST */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <Loader2 className="w-10 h-10 mx-auto text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Fetching Updates...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className={`group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xs ${notification.isRead
                                    ? 'border-slate-100 opacity-60'
                                    : 'border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
                                    }`}
                            >
                                {/* Icon Section */}
                                <div className={`shrink-0 w-full md:w-24 lg:w-32 h-20 md:h-auto flex items-center justify-center ${notification.type === 'CALL' ? 'bg-blue-50/50 text-blue-600' : 'bg-red-50/50 text-red-600'
                                    }`}>
                                    {notification.type === 'CALL' ? <Clock size={32} /> : <ShieldAlert size={32} />}
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase border ${notification.type === 'CALL'
                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : 'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                {notification.type}
                                            </span>
                                            <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                                                <Calendar size={12} />
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>

                                        <h3 className={`text-lg md:text-xl font-black tracking-tight mb-1 uppercase ${notification.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                                            {notification.title}
                                        </h3>
                                        <p className={`text-sm font-medium leading-relaxed ${notification.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {notification.message}
                                        </p>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-50 md:bg-gray-900 text-gray-900 md:text-white px-6 py-4 md:py-3 rounded-xl md:rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all group/btn active:scale-95 shadow-sm"
                                        >
                                            <span className="text-xs uppercase">Mark Read</span>
                                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <BellRing className="w-10 h-10 mx-auto text-gray-200 mb-4" />
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No Notifications Found</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};

export default NotificationPage;

