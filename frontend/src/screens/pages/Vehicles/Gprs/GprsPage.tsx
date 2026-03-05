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
    MapPin
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
        });

        socketRef.current.on("telemetry-update", (newData: any) => {
            setVehicles(prev => prev.map(v =>
                v.vehicleNumber === newData.vehicle
                    ? { ...v, speed: newData.speed, lastSync: newData.date || newData.vdate }
                    : v
            ));
        });

        // 15-minute auto-sync
        const syncInterval = setInterval(async () => {
            try {
                await syncGprsData();
                fetchData();
            } catch (error) {
                console.error("Auto-sync failed:", error);
            }
        }, 15 * 60 * 1000);

        return () => {
            clearInterval(syncInterval);
            socketRef.current?.disconnect();
        };
    }, []);

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await syncGprsData();
            if (res.message === "Sync successful") {
                toast.success(`Synced ${res.count} vehicles`);
                fetchData();
            } else {
                toast.error(res.detail || "Sync failed");
            }
        } catch (error) {
            toast.error("Sync request failed");
        } finally {
            setSyncing(false);
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

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const filteredVehicles = vehicles.filter(v =>
        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.driverName && v.driverName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const assignedDriverNames = vehicles.map(v => v.driverName);
    const unassignedDrivers = drivers.filter(d => !assignedDriverNames.includes(d.name));

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">GPRS Tracking & Driver Assignment</h1>
                    <p className="text-slate-500 text-sm">Monitor speed and assign drivers to vehicles</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold transition-all ${syncing ? "bg-slate-400" : "bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200"
                        }`}
                >
                    <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing..." : "Sync Now"}
                </button>
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
                                    <div key={i} className="h-40 bg-white/50 backdrop-blur-sm animate-pulse rounded-[2rem] border border-slate-100"></div>
                                ))
                            ) : filteredVehicles.length > 0 ? (
                                filteredVehicles.map((vehicle) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={vehicle.id}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, vehicle.vehicleNumber)}
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('button')) return;
                                            navigate(`/vehicles/gprs/track/${vehicle.vehicleNumber}`);
                                        }}
                                        className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-orange-300 transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-orange-50 p-3 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                    <Truck size={24} className="text-orange-600 group-hover:text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 tracking-tight">{vehicle.vehicleNumber}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Fleet Unit</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-black tabular-nums tracking-tighter ${vehicle.speed > 75 ? "text-red-500" : vehicle.speed > 40 ? "text-orange-500" : vehicle.speed > 0 ? "text-emerald-500" : "text-slate-300"}`}>
                                                    {vehicle.speed}
                                                    <span className="text-[10px] ml-1 font-black opacity-50">KM/H</span>
                                                </div>
                                                {vehicle.speed > 0 && <div className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[8px] font-black uppercase rounded-full mt-1">Active</div>}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-50">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`p-1.5 rounded-lg ${vehicle.driverName ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300 font-normal italic'}`}>
                                                    <UserIcon size={14} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personnel</p>
                                                    <p className={`text-xs font-bold truncate ${vehicle.driverName ? "text-slate-700" : "text-slate-400 italic"}`}>
                                                        {vehicle.driverName || "Standby"}
                                                    </p>
                                                </div>
                                            </div>
                                            {vehicle.driverName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100">
                                                        <CheckCircle2 size={12} />
                                                    </div>
                                                    <button
                                                        onClick={() => handleUnassign(vehicle.vehicleNumber)}
                                                        className="w-6 h-6 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center transition-all border border-slate-100"
                                                        title="Unassign Driver"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-2 border border-dashed border-slate-200 rounded-xl text-[9px] font-bold text-slate-300 uppercase tracking-widest hidden group-hover:block transition-all">
                                                    Drop Here
                                                </div>
                                            )}
                                        </div>

                                        {/* Premium background detail */}
                                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                                    <AlertCircle className="mx-auto text-slate-200 mb-4" size={48} />
                                    <h3 className="text-slate-400 font-bold uppercase tracking-[0.2em]">Zero Units Identified</h3>
                                    <p className="text-slate-300 text-xs mt-2 font-medium">Verify search parameters or sync database</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Drivers Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserIcon size={20} className="text-orange-500" />
                            Available Drivers
                        </h2>

                        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 no-scrollbar">
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
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    All drivers are assigned
                                </div>
                            )}
                        </div>

                        {unassignedDrivers.length > 0 && (
                            <p className="mt-4 text-[10px] text-slate-400 text-center italic">
                                Drag and drop a driver onto a vehicle card to assign
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GprsPage;
