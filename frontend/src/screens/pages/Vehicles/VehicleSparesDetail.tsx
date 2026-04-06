import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getVehicleSpares, deleteSparesEntry } from "../../../api/spares";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Package, 
  Trash2, 
  ChevronDown, 
  Image as ImageIcon,
  Loader2,
  TrendingUp,
  Clock,
  CreditCard,
  IndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { FILE_BASE_URL } from "../../../api/base";

const VehicleSparesDetail: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleNumber = location.state?.vehicleNumber || "Vehicle";

  const [spares, setSpares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (vehicleId) {
      loadSpares();
    }
  }, [vehicleId]);

  const loadSpares = async () => {
    try {
      const res = await getVehicleSpares(Number(vehicleId));
      setSpares(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load spares data");
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    try {
      await deleteSparesEntry(id);
      toast.success("Entry deleted");
      loadSpares();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const totalSpent = spares.reduce((sum, item) => sum + Number(item.bill_amount || 0), 0);
  const latestService = spares.length > 0 ? spares[0].date : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving History...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6 lg:p-12 pb-24 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <button
              onClick={() => navigate("/vehicle/spares")}
              className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all group mb-4 text-xs uppercase tracking-widest"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              All Vehicles
            </button>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
              {vehicleNumber} <span className="text-indigo-600">History</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
              <Package size={14} className="text-indigo-400" /> Maintenance & Component Logs
            </p>
          </div>

          <button
            onClick={() => navigate(`/vehicle/spares/add/${vehicleId}`, { state: { vehicleNumber } })}
            className="px-8 py-4 bg-slate-900 border border-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-2xl flex items-center gap-3 active:scale-95"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Total Spent */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
               <IndianRupee size={80} className="text-emerald-600" />
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Expenditure</p>
              <h2 className="text-3xl font-black text-emerald-600 tracking-tight">₹{totalSpent.toLocaleString('en-IN')}</h2>
            </div>
          </div>

          {/* Service Count */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Services</p>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{spares.length}</h2>
            </div>
          </div>

          {/* Latest Service */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-5">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latest Update</p>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {latestService ? new Date(latestService).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}
              </h2>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 mb-2">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronological Logs</h3>
             <div className="h-px bg-slate-200 flex-1 ml-4" />
          </div>

          {spares.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <Package size={56} className="mx-auto text-slate-200 mb-6" strokeWidth={1} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Clear Archive</p>
              <p className="text-slate-300 text-[10px] mt-2 font-medium">No service records found for this vehicle.</p>
            </div>
          ) : (
            spares.map((group) => (
              <div 
                key={group.id} 
                className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${expandedId === group.id ? 'shadow-2xl shadow-indigo-100 border-indigo-200' : 'shadow-xl shadow-slate-200/40 border-slate-100 hover:border-slate-300'}`}
              >
                <div 
                  className="p-6 md:p-8 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group"
                  onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${expandedId === group.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      <Calendar size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{group.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {new Date(group.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Expended Amount</p>
                      <p className="text-xl font-black text-emerald-600 tracking-tight">₹{Number(group.bill_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                       <div className={`p-2 rounded-full transition-transform duration-300 ${expandedId === group.id ? 'bg-indigo-50 rotate-180' : 'bg-slate-50'}`}>
                          <ChevronDown size={20} className={expandedId === group.id ? "text-indigo-600" : "text-slate-300"} />
                       </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === group.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "circOut" }}
                      className="border-t border-slate-50"
                    >
                      <div className="p-8 bg-slate-50/30">
                        <div className="mb-6 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <ImageIcon size={14} className="text-indigo-500" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Digital Evidence ({group.images?.length || 0})
                              </p>
                           </div>
                           <div className="h-px bg-slate-200 flex-1 mx-6" />
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {group.images?.length > 0 ? group.images.map((img: any, i: number) => (
                            <motion.div 
                              key={i}
                              whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 1 : -1 }}
                              className="aspect-square rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl relative group/img cursor-pointer"
                              onClick={() => window.open(`${FILE_BASE_URL}${img.image_url}`, '_blank')}
                            >
                               <img 
                                src={`${FILE_BASE_URL}${img.image_url}`} 
                                alt={`Spare ${i}`} 
                                className="w-full h-full object-cover"
                               />
                               <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg">
                                    <Plus size={20} />
                                  </div>
                               </div>
                            </motion.div>
                          )) : (
                            <div className="col-span-full py-10 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-100">
                               <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No attachments uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSparesDetail;
