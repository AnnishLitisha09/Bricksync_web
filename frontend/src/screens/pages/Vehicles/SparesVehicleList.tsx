import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVehicles } from "../../../api/vehicle";
import { 
  Truck, 
  ChevronRight, 
  Loader2, 
  ArrowLeft, 
  Package, 
  Search, 
  Activity, 
  Shield, 
  LayoutGrid,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SparesVehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles()
      .then((res) => {
        setVehicles(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.vehicleNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Initializing Fleet Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
      {/* ─── IMMERSIVE HERO SECTION ─── */}
      <div className="relative bg-slate-900 pt-20 pb-32 px-6 lg:px-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-indigo-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-emerald-500 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="space-y-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-indigo-400 hover:text-white font-bold transition-all group text-xs uppercase tracking-widest"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Return to Dashboard
              </button>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                  <Activity size={12} className="animate-pulse" /> Fleet Status: Operational
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                  Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Spares</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
                  Browse comprehensive service history, component logs, and maintenance records for your entire heavy vehicle fleet.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Fleet</p>
                <h3 className="text-3xl font-black text-white">{vehicles.length}</h3>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Active</p>
                <h3 className="text-3xl font-black text-white">{vehicles.length}</h3>
              </div>
              <div className="hidden sm:block bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Health</p>
                <h3 className="text-3xl font-black text-white">100%</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER SECTION ─── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-10 relative z-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/10 border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder="Search vehicle number (e.g. TN39...)" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-700 text-lg"
            />
          </div>
          <div className="flex items-center gap-2 px-6 py-5 bg-indigo-50 text-indigo-600 rounded-[1.8rem] border border-indigo-100 shrink-0">
            <LayoutGrid size={20} />
            <span className="font-black text-xs uppercase tracking-widest">Inventory View</span>
          </div>
        </div>
      </div>

      {/* ─── VEHICLE GRID ─── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((v, i) => (
                <motion.div
                  key={v.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -12, transition: { duration: 0.2 } }}
                  onClick={() => navigate(`/vehicle/spares/${v.id}`, { state: { vehicleNumber: v.vehicleNumber } })}
                  className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/60 border border-slate-100 cursor-pointer group relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-200/50"
                >
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <Truck size={120} strokeWidth={1} />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-5 bg-slate-900 text-white rounded-[1.8rem] shadow-xl group-hover:bg-indigo-600 group-hover:scale-110 transition-all duration-300">
                        <Truck size={32} />
                      </div>
                      <div className="flex p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm border border-emerald-100">
                        <Shield size={18} />
                      </div>
                    </div>

                    <div className="space-y-1 mb-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] leading-none mb-2">Registration ID</p>
                      <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{v.vehicleNumber}</h3>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <Zap size={18} fill="currentColor" className="opacity-20" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Log</p>
                            <p className="text-xs font-bold text-slate-600 italic">Recent</p>
                         </div>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-400 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:rotate-12">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-32 text-center bg-white rounded-[4rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                 <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Package size={48} strokeWidth={1.5} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">No Results Found</h3>
                 <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto font-medium lowercase">We couldn't find any vehicles matching your current search parameters.</p>
                 <button onClick={() => setSearch("")} className="mt-8 px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Clear Search</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SparesVehicleList;
