import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Gauge, 
  Fuel, 
  Car, 
  TrendingUp, 
  History, 
  Droplets,
  Plus,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../../api/base";

export default function FuelHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const bunkId = searchParams.get("bunkId");
  const bunkName = searchParams.get("bunkName");

  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vehicle-fuels`, {
          headers: getAuthHeader(),
        });
        const data = await response.json();
        
        // Filter by the bunkId passed in the URL
        const filtered = data.filter((item: any) => item.bunkId === Number(bunkId));
        const total = filtered.reduce((acc: number, curr: any) => acc + curr.amount, 0);
        
        setFuelLogs(filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setTotalSpent(total);
      } catch (err) {
        console.error("Failed to fetch fuel history", err);
      } finally {
        setLoading(false);
      }
    };

    if (bunkId) fetchHistory();
  }, [bunkId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* NAVIGATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-slate-400 hover:text-orange-600 transition-all font-black uppercase tracking-[0.2em] text-[10px]"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100 group-hover:scale-110 transition-all">
            <ArrowLeft size={16} />
          </div>
          Back to Network
        </button>

        <button 
          onClick={() => navigate("/vehicles/fuel/add")}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={16} />
          New Fuel Entry
        </button>
      </div>

      {/* DASHBOARD HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 p-5 bg-orange-50 rounded-3xl text-orange-600">
            <Fuel size={40} strokeWidth={2.5} />
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1">Filling Station</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{bunkName}</h1>
            <p className="text-slate-400 font-bold text-xs mt-2">{fuelLogs.length} Refuel Events Found</p>
          </div>
        </div>

        <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-200 relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-orange-100 uppercase tracking-[0.2em] opacity-80 mb-2">Total Credit Used</p>
            <p className="text-4xl font-black tabular-nums tracking-tight">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">
              LifeTime Ledger
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
            <div className="h-[2px] w-8 bg-orange-500 rounded-full" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Transaction Logs</h3>
        </div>

        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-32 bg-white/40 animate-pulse rounded-[2rem] border border-white" />)}
          </div>
        ) : fuelLogs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <History size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-800 font-black uppercase tracking-tighter">No History</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {fuelLogs.map((log, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={log.fuelId} 
                className={`group bg-white p-2 pr-6 rounded-[2rem] shadow-sm border transition-all flex flex-col md:flex-row items-center gap-6 ${!log.isVerified ? 'border-red-100 bg-red-50/10' : 'border-slate-100 hover:shadow-xl'}`}
              >
                {/* DATE BADGE */}
                <div className={`w-full md:w-32 h-24 rounded-[1.5rem] flex flex-col items-center justify-center border transition-colors ${!log.isVerified ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100 group-hover:bg-orange-50 group-hover:border-orange-100'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">{new Date(log.date).getFullYear()}</span>
                    <span className={`text-2xl font-black leading-none ${!log.isVerified ? 'text-red-600' : 'text-slate-800'}`}>{new Date(log.date).getDate()}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${!log.isVerified ? 'text-red-500' : 'text-orange-600'}`}>
                        {new Date(log.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                </div>

                {/* INFO */}
                <div className="flex-1 py-2 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${!log.isVerified ? 'bg-red-100 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}>
                        <Droplets size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-xl font-black tracking-tight uppercase transition-colors ${!log.isVerified ? 'text-red-700' : 'text-slate-800 group-hover:text-orange-600'}`}>
                                {log.volume} Litres
                            </h3>
                            {!log.isVerified && (
                                <span className="flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter animate-pulse">
                                    <AlertCircle size={10} />
                                    Unverified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            {log.isVerified ? (
                                <CheckCircle2 size={12} className="text-emerald-500" />
                            ) : (
                                <AlertCircle size={12} className="text-red-400" />
                            )}
                            <p className={`text-[10px] font-black uppercase tracking-widest ${log.isVerified ? 'text-slate-400' : 'text-red-500 italic'}`}>
                                {log.isVerified ? "Transaction Verified" : "Transaction Not Verified"}
                            </p>
                        </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-6 p-4 rounded-2xl border ${!log.isVerified ? 'bg-white border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Odometer</p>
                         <div className="flex items-center gap-2 text-slate-700">
                           <Gauge size={14} className={!log.isVerified ? 'text-red-500' : 'text-orange-500'} />
                           <span className="text-sm font-black tabular-nums">{log.kilometer.toLocaleString()} KM</span>
                         </div>
                      </div>
                      <div className="w-[1px] h-8 bg-slate-200" />
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                         <span className={`text-xl font-black tabular-nums ${!log.isVerified ? 'text-red-600' : 'text-slate-900'}`}>₹{log.amount.toLocaleString()}</span>
                      </div>
                  </div>
                </div>

                {/* VEHICLE */}
                <div className={`w-full md:w-56 p-4 rounded-[1.5rem] relative overflow-hidden shadow-lg transition-colors ${!log.isVerified ? 'bg-red-950 shadow-red-200/50' : 'bg-slate-900'}`}>
                   <div className="flex items-center gap-3 mb-2">
                     <Car size={14} className={!log.isVerified ? 'text-red-400' : 'text-orange-400'} />
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Vehicle</span>
                   </div>
                   <p className="text-white font-black text-sm uppercase truncate mb-1">{log.vehicle.vehicleName}</p>
                   <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${!log.isVerified ? 'text-red-400 bg-red-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                      {log.vehicle.vehicleNumber}
                   </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}