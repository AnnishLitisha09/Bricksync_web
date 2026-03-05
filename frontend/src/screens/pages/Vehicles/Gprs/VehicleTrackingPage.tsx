import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft, MapPin, Clock, User as UserIcon,
    Navigation, Activity, Zap, Maximize, Target,
    ShieldCheck
} from "lucide-react";
import { getVehicleLiveData } from "../../../../api/gprs";
import { io, type Socket } from "socket.io-client";
import { FILE_BASE_URL } from "../../../../api/base";

const SOCKET_URL = FILE_BASE_URL;

// --- COMPACT GAUGE ---
const SpeedGauge = ({ speed }: { speed: number }) => {
    const [displaySpeed, setDisplaySpeed] = useState(0);

    useEffect(() => {
        let frame: number;
        const start = displaySpeed;
        const end = speed;
        const duration = 800;
        const startTime = performance.now();

        const animate = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            setDisplaySpeed(Math.floor(start + (end - start) * progress));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [speed]);

    const circumference = 2 * Math.PI * 70;
    const offset = circumference - (Math.min(displaySpeed, 140) / 140) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
            <div className="absolute top-4 left-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Velocity</span>
            </div>

            <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <motion.circle
                    cx="80" cy="80" r="70"
                    stroke="#f97316"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ strokeDashoffset: offset }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                <span className="text-4xl font-black text-slate-900 tabular-nums">{displaySpeed}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">km/h</span>
            </div>
        </div>
    );
};

const VehicleTrackingPage = () => {
    const { vehicleNumber } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);

    // Helper to format the Date/Last Seen
    const formatLastSeen = (dateString: string) => {
        if (!dateString) return "Syncing...";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        const fetchLiveData = async () => {
            try {
                const res = await getVehicleLiveData(vehicleNumber!);
                if (res) {
                    setData(res);
                    if (mapRef.current) updateMap(res.latitude, res.longitude);
                }
            } finally { setLoading(false); }
        };

        if (!(window as any).L) {
            const link = document.createElement("link");
            link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => fetchLiveData();
            document.head.appendChild(script);
        } else fetchLiveData();

        socketRef.current = io(SOCKET_URL);
        socketRef.current.on("connect", () => socketRef.current?.emit("join-vehicle", vehicleNumber));
        socketRef.current.on("telemetry-update", (newData: any) => {
            if (newData.vehicle === vehicleNumber) {
                setData(newData);
                updateMap(newData.latitude, newData.longitude);
            }
        });

        return () => {
            socketRef.current?.disconnect();
            if (mapRef.current) mapRef.current.remove();
        };
    }, [vehicleNumber]);

    useEffect(() => {
        if (!loading && !mapRef.current && (window as any).L) {
            const L = (window as any).L;
            mapRef.current = L.map('map-container', { zoomControl: false, attributionControl: false })
                .setView([data?.latitude || 11.0, data?.longitude || 76.9], 15);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
            if (data) updateMap(data.latitude, data.longitude);
        }
    }, [loading]);

    const updateMap = (lat: number, lng: number) => {
        const L = (window as any).L;
        if (!L || !mapRef.current || !lat || !lng) return;
        if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'm-icon',
                    html: `<div class="dot-main"><div class="dot-ping"></div></div>`,
                    iconSize: [20, 20], iconAnchor: [10, 10]
                })
            }).addTo(mapRef.current);
        } else {
            markerRef.current.setLatLng([lat, lng]);
        }
        mapRef.current.flyTo([lat, lng], 16, { duration: 1.5 });
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white text-orange-500 font-black tracking-widest uppercase animate-pulse">Initializing System...</div>;

    return (
        <div className="h-screen bg-[#f8fafc] p-4 flex flex-col overflow-hidden font-sans">
            <style>{`
                .m-icon { background: none!important; }
                .dot-main { width: 14px; height: 14px; background: #f97316; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(249,115,22,0.5); position: relative; }
                .dot-ping { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #f97316; animation: ping 2s infinite; opacity: 0.4; }
                @keyframes ping { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(3); opacity: 0; } }
            `}</style>

            {/* HEADER */}
            <header className="flex justify-between items-center mb-4 bg-white p-3 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="h-8 w-px bg-slate-100" />
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Unit: {vehicleNumber}</h1>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Live Telemetry
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <ShieldCheck size={16} className="text-orange-500" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Security Link Verified</span>
                </div>
            </header>

            {/* MAIN CONTENT GRID */}
            <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">

                {/* LEFT PANEL */}
                <aside className="col-span-4 lg:col-span-3 flex flex-col gap-4 overflow-hidden">
                    {/* INFO CARD */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col flex-1 overflow-y-auto">
                        <div className="space-y-6">
                            <DetailRow 
                                icon={<UserIcon size={16} />} 
                                label="Pilot" 
                                value={data?.assignedDriver || "Mohan"} 
                            />
                            
                            <DetailRow 
                                icon={<MapPin size={16} />} 
                                label="Sector" 
                                value={data?.nearestlocation || "Angeripalayam Main Road-Vengamedu-Chettipalayam-Tiruppur-Tamil Nadu-India"} 
                                isAddress
                            />

                            <DetailRow 
                                icon={<Clock size={16} />} 
                                label="Last Seen" 
                                value={formatLastSeen(data?.date)} 
                            />
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 space-y-3">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className={data?.sensor1 === 'ON' ? 'text-orange-500' : 'text-slate-300'} />
                                    <span className="text-[9px] font-black uppercase text-slate-400">Ignition</span>
                                </div>
                                <span className={`text-[10px] font-black ${data?.sensor1 === 'ON' ? 'text-orange-500' : 'text-slate-400'}`}>{data?.sensor1 || "OFF"}</span>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-blue-500" />
                                    <span className="text-[9px] font-black uppercase text-slate-400">Battery</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-700">{data?.intbat || "0.0"}V</span>
                            </div>
                        </div>
                    </div>

                    {/* SPEED GAUGE */}
                    <div className="h-56">
                        <SpeedGauge speed={data?.speed || 0} />
                    </div>
                </aside>

                {/* RIGHT PANEL: MAP */}
                <main className="col-span-8 lg:col-span-9 h-full bg-white p-2 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div id="map-container" className="w-full h-full rounded-[2.5rem] overflow-hidden" />

                    {/* MAP CONTROLS */}
                    <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
                        <button onClick={() => mapRef.current?.zoomIn()} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-orange-500 transition-colors border border-slate-100">
                            <Maximize size={18} />
                        </button>
                        <button onClick={() => mapRef.current?.zoomOut()} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-2xl text-slate-600 hover:text-orange-500 transition-colors border border-slate-100">
                            <Target size={18} />
                        </button>
                    </div>

                    {/* BOTTOM HUD */}
                    <div className="absolute bottom-6 inset-x-6 z-[1000] flex justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white shadow-xl pointer-events-auto flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Longitude</span>
                                <span className="text-sm font-black text-slate-800 tabular-nums">{data?.longitude?.toFixed(5) || "0.00000"}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Latitude</span>
                                <span className="text-sm font-black text-slate-800 tabular-nums">{data?.latitude?.toFixed(5) || "0.00000"}</span>
                            </div>
                            <div className="ml-4 p-2 bg-orange-500 rounded-xl text-white">
                                <Navigation size={18} className="rotate-45" />
                            </div>
                        </div>
                    </div>
                </main>

            </div>
        </div>
    );
};

// Updated DetailRow with Multi-line support for long Sector addresses
const DetailRow = ({ icon, label, value, isAddress }: any) => (
    <div className="flex items-start gap-4 group">
        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-orange-500 transition-colors mt-1">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-xs font-bold text-slate-700 ${isAddress ? 'leading-relaxed break-words' : 'truncate'}`}>
                {value}
            </p>
        </div>
    </div>
);

export default VehicleTrackingPage;