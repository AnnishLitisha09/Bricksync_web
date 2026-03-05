import { motion } from "framer-motion";
import {
    Activity,
    ArrowLeft,
    Clock,
    MapPin,
    Maximize,
    Navigation,
    ShieldCheck,
    Target,
    User as UserIcon,
    Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { FILE_BASE_URL } from "../../../../api/base";
import { getVehicleLiveData } from "../../../../api/gprs";

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
        <div className="relative flex flex-col items-center justify-center bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm h-full w-full">
            <div className="absolute top-4 left-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Velocity</span>
            </div>

            <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
                <circle cx="50%" cy="50%" r="70" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <motion.circle
                    cx="50%" cy="50%" r="70"
                    stroke="#f97316"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                    animate={{ strokeDashoffset: offset }}
                    style={{ strokeDasharray: circumference }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
                <span className="text-3xl md:text-4xl font-black text-slate-900 tabular-nums">{displaySpeed}</span>
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
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);

    const formatLastSeen = (dateString: string) => {
        if (!dateString) return "Syncing...";
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ", " +
            date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
        <div className="h-screen bg-[#f8fafc] p-2 md:p-4 flex flex-col overflow-hidden font-sans">
            <style>{`
                .m-icon { background: none!important; }
                .dot-main { width: 14px; height: 14px; background: #f97316; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(249,115,22,0.5); position: relative; }
                .dot-ping { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #f97316; animation: ping 2s infinite; opacity: 0.4; }
                @keyframes ping { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(3); opacity: 0; } }
                .leaflet-container { font-family: inherit; }
            `}</style>

            {/* HEADER */}
            <header className="flex justify-between items-center mb-2 md:mb-4 bg-white p-2 md:p-3 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm z-[1001]">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <ArrowLeft size={18} className="text-slate-600" />
                    </button>
                    <div className="h-6 w-px bg-slate-100" />
                    <div>
                        <h1 className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter">Unit: {vehicleNumber}</h1>
                        <p className="text-[8px] md:text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Live
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <ShieldCheck size={14} className="text-orange-500" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Secured</span>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 overflow-hidden relative">

                {/* ASIDE - Sidebar on Desktop, Overlay Bottom Sheet on Mobile */}
                <aside className={`
                    fixed inset-x-0 bottom-0 z-[1005] bg-white rounded-t-[2.5rem] shadow-2xl transition-transform duration-500 md:static md:inset-auto md:z-0 md:bg-transparent md:shadow-none md:translate-y-0 md:rounded-none md:col-span-4 lg:col-span-3 md:flex md:flex-col md:gap-4
                    ${isMobilePanelOpen ? 'translate-y-0 h-[70vh]' : 'translate-y-[calc(100%-60px)] md:h-full'}
                `}>
                    {/* Mobile Toggle Handle */}
                    <button
                        onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
                        className="w-full flex flex-col items-center py-2 md:hidden"
                    >
                        <div className="w-12 h-1 bg-slate-200 rounded-full mb-2" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle Status</span>
                    </button>

                    <div className="flex flex-col h-full overflow-hidden p-4 md:p-0 md:gap-4">
                        {/* INFO CARD */}
                        <div className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-1 overflow-y-auto">
                            <div className="space-y-4 md:space-y-6">
                                <DetailRow icon={<UserIcon size={16} />} label="Pilot" value={data?.assignedDriver || "Mohan"} />
                                <DetailRow
                                    icon={<MapPin size={16} />}
                                    label="Sector"
                                    value={data?.nearestlocation || "Location loading..."}
                                    isAddress
                                />
                                <DetailRow icon={<Clock size={16} />} label="Last Seen" value={formatLastSeen(data?.date)} />
                            </div>

                            <div className="mt-6 md:mt-auto pt-4 md:pt-6 border-t border-slate-50 space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className={data?.sensor1 === 'ON' ? 'text-orange-500' : 'text-slate-300'} />
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ignition</span>
                                    </div>
                                    <span className={`text-[10px] font-black ${data?.sensor1 === 'ON' ? 'text-orange-500' : 'text-slate-400'}`}>{data?.sensor1 || "OFF"}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-blue-500" />
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Battery</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700">{data?.intbat || "0.0"}V</span>
                                </div>
                            </div>
                        </div>

                        {/* SPEED GAUGE - Hidden on small mobile heights when panel is open */}
                        <div className="hidden md:block h-56">
                            <SpeedGauge speed={data?.speed || 0} />
                        </div>
                    </div>
                </aside>

                {/* MAP AREA */}
                <main className="flex-1 md:col-span-8 lg:col-span-9 bg-white p-1 md:p-2 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden h-full">
                    <div id="map-container" className="w-full h-full rounded-[1.8rem] md:rounded-[2.5rem] overflow-hidden" />

                    {/* FLOATING SPEED (MOBILE ONLY) */}
                    <div className="absolute top-4 left-4 z-[1000] md:hidden">
                        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white shadow-lg flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[14px] font-black text-slate-900 leading-none">{data?.speed || 0}</span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">KM/H</span>
                            </div>
                        </div>
                    </div>

                    {/* MAP CONTROLS */}
                    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                        <button onClick={() => mapRef.current?.zoomIn()} className="p-2 md:p-3 bg-white/90 backdrop-blur shadow-sm rounded-xl md:rounded-2xl text-slate-600 hover:text-orange-500 border border-slate-100">
                            <Maximize size={16} />
                        </button>
                        <button onClick={() => mapRef.current?.zoomOut()} className="p-2 md:p-3 bg-white/90 backdrop-blur shadow-sm rounded-xl md:rounded-2xl text-slate-600 hover:text-orange-500 border border-slate-100">
                            <Target size={16} />
                        </button>
                    </div>

                    {/* BOTTOM HUD - Compact on mobile */}
                    <div className="absolute bottom-16 md:bottom-6 inset-x-4 md:inset-x-6 z-[1000] flex justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl border border-white shadow-xl pointer-events-auto flex items-center gap-4 md:gap-6">
                            <div className="flex flex-col">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Lng</span>
                                <span className="text-xs md:text-sm font-black text-slate-800 tabular-nums">{data?.longitude?.toFixed(4) || "0.0000"}</span>
                            </div>
                            <div className="h-6 w-px bg-slate-200" />
                            <div className="flex flex-col">
                                <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Lat</span>
                                <span className="text-xs md:text-sm font-black text-slate-800 tabular-nums">{data?.latitude?.toFixed(4) || "0.0000"}</span>
                            </div>
                            <div className="p-2 bg-orange-500 rounded-lg md:rounded-xl text-white">
                                <Navigation size={14} className="rotate-45" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, isAddress }: any) => (
    <div className="flex items-start gap-3 md:gap-4 group">
        <div className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 group-hover:text-orange-500 transition-colors mt-0.5">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{label}</p>
            <p className={`text-[11px] md:text-xs font-bold text-slate-700 ${isAddress ? 'leading-relaxed' : 'truncate'}`}>
                {value}
            </p>
        </div>
    </div>
);

export default VehicleTrackingPage;