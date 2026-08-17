import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Truck,
    Search,
    RefreshCw,
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    X,
    ArrowLeft
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getGprsSummary, syncGprsData, assignDriver } from "../../../../api/gprs";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../../api/base";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

interface GprsRecord {
    id: number;
    vehicleNumber: string;
    speed: number;
    driverName: string;
    lastSync: string;
    isLive?: boolean;
}

interface Driver {
    userid: number;
    name: string;
    phoneNumber: string;
    staffRole: string;
}

const GprsPage = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState<GprsRecord[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const socketRef = useRef<Socket | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [vehicleRes, driverRes] = await Promise.all([
                getGprsSummary(),
                fetch(`${BASE_URL}/user/drivers?limit=100`, { headers: getAuthHeader() }).then(res => res.json())
            ]);

            setVehicles(vehicleRes);
            setDrivers(driverRes.drivers || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load tracking data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Socket Connection
        socketRef.current = io(FILE_BASE_URL);

        socketRef.current.on("connect", () => {
            console.log("🟢 GPRS List Connected to Real-time Stream");
            // Join the global fleet-dashboard room to receive all vehicle updates
            socketRef.current?.emit("join-dashboard");
        });

        socketRef.current.on("telemetry-update", (newData: any) => {
            setVehicles(prev => prev.map(v =>
                v.vehicleNumber.trim().toUpperCase() === newData.vehicle.trim().toUpperCase()
                    ? {
                        ...v,
                        speed: newData.speed,
                        lastSync: newData.date || newData.vdate || new Date().toISOString(),
                        isLive: true
                    }
                    : v
            ));
        });

        // Periodically check for stale 'live' status without causing infinite re-renders
        const liveCheckInterval = setInterval(() => {
            const now = Date.now();
            setVehicles(prev => {
                let hasChanges = false;
                const next = prev.map(v => {
                    if (v.isLive && v.lastSync && (now - new Date(v.lastSync).getTime() > 15000)) {
                        hasChanges = true;
                        return { ...v, isLive: false };
                    }
                    return v;
                });
                return hasChanges ? next : prev;
            });
        }, 5000);

        // 30-second auto-sync
        const syncInterval = setInterval(async () => {
            try {
                await syncGprsData();
                fetchData();
            } catch (error) {
                console.error("Auto-sync failed:", error);
            }
        }, 30 * 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(liveCheckInterval);
            socketRef.current?.disconnect();
        };
    }, []);

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await syncGprsData();
            if (res.message === "Sync successful") {
                toast.success(`Synced ${res.count} Vehicles Successfully`, {
                    style: {
                        borderRadius: '16px',
                        background: '#334155',
                        color: '#fff',
                        fontWeight: 'bold'
                    }
                });
                fetchData();
            } else {
                toast.error(res.detail || "Sync failed");
            }
        } catch (error) {
            toast.error("Network synchronization failed");
        } finally {
            // Keep syncing state for a bit longer for visual impact
            setTimeout(() => setSyncing(false), 800);
        }
    };

    const onDragStart = (e: React.DragEvent, driverName: string) => {
        e.dataTransfer.setData("driverName", driverName);
    };

    const onDrop = async (e: React.DragEvent, vehicleNumber: string) => {
        const driverName = e.dataTransfer.getData("driverName");
        if (!driverName) return;

        try {
            const res = await assignDriver(vehicleNumber, driverName);
            if (res.message === "Driver assigned successfully") {
                toast.success(`Assigned ${driverName} to ${vehicleNumber} `);
                // Optimistic update
                setVehicles(prev => prev.map(v =>
                    v.vehicleNumber === vehicleNumber ? { ...v, driverName } : v
                ));
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Assignment failed");
        }
    };

    const handleUnassign = async (vehicleNumber: string) => {
        try {
            const res = await assignDriver(vehicleNumber, "");
            if (res.message === "Driver assigned successfully") {
                toast.success(`Unassigned driver from ${vehicleNumber} `);
                setVehicles(prev => prev.map(v =>
                    v.vehicleNumber === vehicleNumber ? { ...v, driverName: "" } : v
                ));
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Unassignment failed");
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.driverName && v.driverName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const assignedDriverNames = vehicles.map(v => v.driverName).filter(name => name !== "");
    const unassignedDrivers = drivers.filter(d => !assignedDriverNames.includes(d.name));
    const assignedDrivers = drivers.filter(d => assignedDriverNames.includes(d.name));

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-5">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 shadow-sm text-slate-600 hover:text-orange-500"
                        title="Go Back"
                    >
                        <ArrowLeft size={22} />
                    </motion.button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">GPRS Tracking & Driver Assignment</h1>
                        <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Live Fleet Telemetry & Personnel Management
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSync}
                    disabled={syncing}
                    className={`relative group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black transition-all overflow-hidden ${syncing
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-[length:200%_auto] hover:bg-right shadow-[0_10px_25px_-5px_rgba(249,115,22,0.4)]"
                        }`}
                >
                    <RefreshCw
                        size={20}
                        className={`${syncing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                    />
                    <span className="tracking-wide uppercase text-sm">{syncing ? "Synchronizing..." : "Sync Now"}</span>
                    {!syncing && (
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"></div>
                    )}
                </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Vehicles Column */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search vehicle or driver..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 border-transparent focus:border-orange-500 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-56 bg-white animate-pulse rounded-[2.5rem] border border-slate-100 shadow-sm"></div>
                                ))
                            ) : filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={vehicle.id}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => onDrop(e, vehicle.vehicleNumber)}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button')) return;
                                            navigate(`/vehicles/gprs/track/${vehicle.vehicleNumber}`);
                                        }}
                                        className="group bg-white p-6 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.02)] border border-slate-100 hover:border-orange-200 hover:shadow-[0_20px_50px_-15px_rgba(249,115,22,0.08)] transition-all relative overflow-hidden cursor-pointer active:scale-[0.98] flex flex-col h-full"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-50 p-4 rounded-[1.25rem] group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_8px_20px_-5px_rgba(249,115,22,0.4)] transition-all duration-300">
                                                    <Truck size={28} className="text-slate-400 group-hover:text-white transition-colors" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                        {vehicle.vehicleNumber}
                                                        {vehicle.isLive && (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-full animate-pulse border border-emerald-200">
                                                                Live
                                                            </span>
                                                        )}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                        Fleet Resource ID
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-4xl font-black tabular-nums tracking-tighter ${vehicle.speed > 75 ? "text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                                                    vehicle.speed > 40 ? "text-orange-500" :
                                                        vehicle.speed > 0 ? "text-emerald-500" :
                                                            "text-slate-200"
                                                    }`}>
                                                    {vehicle.speed}
                                                    <span className="text-xs ml-1 font-black opacity-40">KM/H</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-50 group-hover:bg-white group-hover:border-orange-100 group-hover:shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)] transition-all">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`p-2 rounded-xl shadow-sm ${vehicle.driverName ? 'bg-white text-orange-500' : 'bg-white text-slate-200'}`}>
                                                    <UserIcon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personnel</p>
                                                    <h4 className={`text-sm font-black truncate leading-tight ${vehicle.driverName ? "text-slate-700" : "text-slate-300 italic"}`}>
                                                        {vehicle.driverName || "No Assignment"}
                                                    </h4>
                                                </div>
                                            </div>
                                            {vehicle.driverName ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUnassign(vehicle.vehicleNumber);
                                                        }}
                                                        className="w-9 h-9 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all border border-slate-200 hover:border-red-200 shadow-sm"
                                                        title="Terminate Assignment"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1.5 border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                                                    Ready for Drop
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between text-[10px] px-2">
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider">
                                                <RefreshCw size={10} className={vehicle.isLive ? "animate-spin text-emerald-500" : ""} />
                                                <span>{new Date(vehicle.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                            </div>
                                            <motion.div
                                                initial={{ x: -5, opacity: 0 }}
                                                whileHover={{ x: 0, opacity: 1 }}
                                                className="text-orange-500 font-black uppercase tracking-widest flex items-center gap-1"
                                            >
                                                Details <ArrowLeft size={10} className="rotate-180" />
                                            </motion.div>
                                        </div>

                                        {/* Subtle background glow */}
                                        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${vehicle.isLive ? "bg-emerald-500/10 opacity-100" : "bg-orange-500/5 opacity-0 group-hover:opacity-100"
                                            }`}></div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle className="text-slate-200" size={40} />
                                    </div>
                                    <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-lg">Empty Fleet</h3>
                                    <p className="text-slate-300 text-sm mt-3 font-medium">Verify system filters or refresh synchronization</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Drivers Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6 max-h-[calc(100vh-48px)] overflow-hidden flex flex-col">
                        {/* Available Drivers */}
                        <div className="flex-1 flex flex-col min-h-0 border-b border-slate-50 pb-6 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <UserIcon size={20} className="text-orange-500" />
                                Available Drivers
                            </h2>

                            <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl"></div>
                                    ))
                                ) : unassignedDrivers.length > 0 ? (
                                    unassignedDrivers.map((driver) => (
                                        <div
                                            key={driver.userid}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, driver.name)}
                                            className="p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-grab active:cursor-grabbing hover:bg-white hover:border-orange-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                                                    {driver.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-700">{driver.name}</h4>
                                                    <p className="text-[10px] text-slate-400">{driver.phoneNumber || "No phone"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm italic">
                                        All drivers are assigned
                                    </div>
                                )}
                            </div>

                            {unassignedDrivers.length > 0 && (
                                <p className="mt-4 text-[10px] text-slate-400 text-center italic">
                                    Drag and drop to assign
                                </p>
                            )}
                        </div>

                        {/* Assigned Drivers */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-emerald-500" />
                                Assigned Drivers
                            </h2>

                            <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar">
                                {loading ? (
                                    [1, 2].map(i => (
                                        <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl"></div>
                                    ))
                                ) : assignedDrivers.length > 0 ? (
                                    assignedDrivers.map((driver) => {
                                        const vehicle = vehicles.find(v => v.driverName === driver.name);
                                        return (
                                            <div
                                                key={driver.userid}
                                                className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                                            {driver.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-700">{driver.name}</h4>
                                                            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                                <Truck size={10} /> {vehicle?.vehicleNumber || "Searching..."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnassign(vehicle?.vehicleNumber || "")}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Unassign Driver"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm italic">
                                        No active assignments
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GprsPage;
