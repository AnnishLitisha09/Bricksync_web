import { motion } from "framer-motion";
import {
  ArrowLeft,
  Car,
  FileText,
  Gauge,
  History,
  Plus,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../../api/base";

export default function ServiceHistoryPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const shopId = searchParams.get("shopId");
  const shopName = searchParams.get("shopName");

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/vehicle-services`, {
          headers: getAuthHeader(),
        });
        const data = await response.json();
        
        const filtered = data.filter((item: any) => item.serviceShopId === Number(shopId));
        const total = filtered.reduce((acc: number, curr: any) => acc + curr.amount, 0);
        
        setServices(filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setTotalSpent(total);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) fetchHistory();
  }, [shopId]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* NAVIGATION & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-slate-400 hover:text-emerald-600 transition-all font-black uppercase tracking-[0.2em] text-[10px]"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:scale-110 transition-all">
            <ArrowLeft size={16} />
          </div>
          Back to Hubs
        </button>

        <button 
          onClick={() => navigate("/vehicles/services/add")}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {/* GLOSSY DASHBOARD HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
          
          <div className="relative z-10 p-5 bg-emerald-50 rounded-3xl text-emerald-600">
            <History size={40} strokeWidth={2.5} />
          </div>
          
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Partner Workshop</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{shopName}</h1>
            <div className="flex items-center gap-4 mt-2">
               <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                  <FileText size={14} className="text-slate-300" />
                  <span>{services.length} Total Services</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.2em] opacity-80 mb-2">Total Account Value</p>
            <p className="text-4xl font-black tabular-nums tracking-tight">₹{totalSpent.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest">
              Lifetime Spends
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE LISTING */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
            <div className="h-[2px] w-8 bg-emerald-500 rounded-full" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Service Timeline</h3>
        </div>

        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-32 bg-white/40 animate-pulse rounded-[2rem] border border-white" />)}
          </div>
        ) : services.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <History size={32} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Logs Found</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">No records have been filed for this shop yet.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {services.map((service, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={service.id} 
                className="group bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-100 transition-all flex flex-col md:flex-row items-center gap-6"
              >
                {/* DATE BADGE */}
                <div className="w-full md:w-32 h-24 bg-slate-50 rounded-[1.5rem] flex flex-col items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                        {new Date(service.date).getFullYear()}
                    </span>
                    <span className="text-2xl font-black text-slate-800 leading-none">
                        {new Date(service.date).getDate()}
                    </span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                        {new Date(service.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 py-2 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-emerald-600 transition-colors">
                        {service.topic}
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-1 leading-relaxed max-w-xl">
                        {service.description || "No detailed notes provided for this service visit."}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Odometer</p>
                           <div className="flex items-center gap-2 text-slate-700">
                             <Gauge size={14} className="text-emerald-500" />
                             <span className="text-sm font-black tabular-nums">{service.kilometer.toLocaleString()} KM</span>
                           </div>
                        </div>
                        <div className="w-[1px] h-8 bg-slate-200" />
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cost</p>
                           <span className="text-xl font-black text-slate-900 tabular-nums">₹{service.amount.toLocaleString()}</span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* VEHICLE IDENTITY BADGE */}
                <div className="w-full md:w-56 p-4 bg-slate-900 rounded-[1.5rem] relative overflow-hidden group/v shadow-lg shadow-slate-200">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-8 -mt-8" />
                   <div className="flex items-center gap-3 mb-2">
                     <div className="p-1.5 bg-white/10 rounded-lg text-emerald-400">
                        <Car size={14} />
                     </div>
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Vehicle ID</span>
                   </div>
                   <p className="text-white font-black text-sm uppercase truncate mb-1">{service.vehicle.vehicleName}</p>
                   <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                      {service.vehicle.vehicleNumber}
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