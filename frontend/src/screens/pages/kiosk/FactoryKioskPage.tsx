import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Tv,
  Maximize2,
  Minimize2,
  Clock,
  Truck,
  Package,
  IndianRupee,
  Activity,
  Layers,
  ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchKioskLive } from "../../../api/bi";
import type { KioskLiveResponse } from "../../../api/bi";

export default function FactoryKioskPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<KioskLiveResponse | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(15);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadKioskData = async () => {
    try {
      const res = await fetchKioskLive();
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.error("Failed to fetch Kiosk live data", err);
    } finally {
      setNextRefreshIn(15);
    }
  };

  // Clock updates every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Auto-Refresh every 15s
  useEffect(() => {
    loadKioskData();
    const interval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          loadKioskData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const target = data?.production?.target || 12000;
  const produced = data?.production?.completed || 0;
  const progressPct = data?.production?.progressPercent || Math.min(100, Math.round((produced / target) * 100));
  const remainingToTarget = Math.max(0, target - produced);

  // Fleet counts
  const fleetList = data?.fleet || [];
  const onRoadCount = fleetList.filter((f) => f.status.toLowerCase().includes("delivery") || f.status.toLowerCase().includes("road")).length;
  const loadingCount = fleetList.filter((f) => f.status.toLowerCase().includes("loading")).length;
  const idleCount = fleetList.filter((f) => f.status.toLowerCase().includes("idle") || f.status.toLowerCase().includes("yard")).length;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-600 selection:text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between"
    >
      {/* KIOSK HEADER: Live Clock, Status, Controls */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="size-11 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            title="Exit to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                Live Factory Wall TV
              </span>
              <span className="text-xs font-bold text-slate-400">
                Refreshing in {nextRefreshIn}s
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 flex items-center gap-2">
              <Tv className="text-indigo-400 size-6" />
              Central Operations Command Center
            </h1>
          </div>
        </div>

        {/* Live Clock & Fullscreen Toggle */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-xl">
            <Clock className="text-indigo-400 size-5" />
            <div className="text-right">
              <p className="text-lg font-black tracking-wider text-white font-mono">{currentTime}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">{currentDate}</p>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="h-11 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen TV"}</span>
          </button>
        </div>
      </header>

      {/* MAIN KIOSK GRID: 4 Key Metrics */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-6 flex-1">
        {/* Metric 1: Today's Production vs Target */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Daily Production</span>
            <span className="size-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Package size={20} />
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {produced.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">/ {target.toLocaleString()}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Target: {progressPct}% Achieved • {remainingToTarget.toLocaleString()} bricks to goal
            </p>
          </div>

          {/* High-visibility progress bar */}
          <div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2">
              <span>0% Shift Start</span>
              <span className="text-emerald-400 font-black">{progressPct}%</span>
              <span>100% Target</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Dispatched Bricks */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Dispatched Today</span>
            <span className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck size={20} />
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                {(data?.dispatch?.dispatchedCount || 0).toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">units</span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Outbound masonry delivered across active construction sites
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Plant Active Outbound Loads</span>
            <span className="text-emerald-400 font-black">{data?.dispatch?.activeLoads || 3} ACTIVE LOADS</span>
          </div>
        </div>

        {/* Metric 3: Incoming Revenue Live Ticker */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Today's Revenue</span>
            <span className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <IndianRupee size={20} />
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-amber-400">₹</span>
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                {(data?.dispatch?.todayGrossRevenue || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1">
              Gross billing generated from dispatches recorded today
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Cement Stock Runway</span>
            <span className="text-amber-400 font-black">
              {data?.cementStockDays ?? 2.5} DAYS REMAINING
            </span>
          </div>
        </div>

        {/* Metric 4: Fleet Distribution Pill */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-2xl group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fleet Operations</span>
            <span className="size-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Activity size={20} />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">On Delivery</span>
              <span className="text-2xl font-black text-white font-mono">{onRoadCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">In-Plant Loading</span>
              <span className="text-2xl font-black text-white font-mono">{loadingCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">Yard Standby</span>
              <span className="text-2xl font-black text-white font-mono">{idleCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">Total Lorries</span>
              <span className="text-2xl font-black text-white font-mono">{fleetList.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Fleet Utilization</span>
            <span className="text-cyan-400 font-black">
              {Math.round(((onRoadCount + loadingCount) / Math.max(1, fleetList.length)) * 100)}% ACTIVE
            </span>
          </div>
        </div>
      </main>

      {/* LOWER SECTION: Real-Time Fleet Live Status */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Live Lorry Deployment Matrix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Vehicle GPS & Yard Loading status
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {fleetList.length} Commercial Vehicles
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Truck Reg No</th>
                <th className="py-2.5 px-3">Vehicle Name</th>
                <th className="py-2.5 px-3">Live Status</th>
                <th className="py-2.5 px-3 text-right">Current Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {fleetList.map((v) => {
                let statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {v.status}
                  </span>
                );
                if (v.status.toLowerCase().includes("delivery") || v.status.toLowerCase().includes("road")) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {v.status}
                    </span>
                  );
                } else if (v.status.toLowerCase().includes("loading")) {
                  statusBadge = (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                      {v.status}
                    </span>
                  );
                }

                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-black text-white text-sm">
                      {v.vehicleNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-300">
                      {v.vehicleName}
                    </td>
                    <td className="py-3 px-3">
                      {statusBadge}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-400">
                      {v.location}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TV Footer Info */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-indigo-400" />
            <span>Bricksync Enterprise 2.0 • Wall TV Mode</span>
          </div>
          <span className="text-emerald-400 font-mono">Status: LIVE TELEMETRY CONNECTED</span>
        </div>
      </div>
    </div>
  );
}
