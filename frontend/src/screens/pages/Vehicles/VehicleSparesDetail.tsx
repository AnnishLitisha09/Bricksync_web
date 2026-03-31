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
  ChevronUp,
  Image as ImageIcon,
  Loader2
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate("/vehicle/spares")}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-4"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Vehicles
            </button>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
              {vehicleNumber} <span className="text-indigo-600">History</span>
            </h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <Package size={14} className="text-indigo-400" /> Spares and service logs
            </p>
          </div>

          <button
            onClick={() => navigate(`/vehicle/spares/add/${vehicleId}`, { state: { vehicleNumber } })}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-3 active:scale-95"
          >
            <Plus size={18} /> Add New Entry
          </button>
        </div>

        <div className="space-y-6">
          {spares.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
              <Package size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest">No entries found for this vehicle</p>
            </div>
          ) : (
            spares.map((group) => (
              <div key={group.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-100/50">
                <div 
                  className="p-8 cursor-pointer flex justify-between items-center group"
                  onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl transition-colors ${expandedId === group.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{group.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {new Date(group.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill Amount</p>
                      <p className="text-lg font-black text-emerald-600">₹{Number(group.bill_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                        className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 size={18} />
                       </button>
                       <div className="p-2 transition-transform duration-300">
                          {expandedId === group.id ? <ChevronUp size={24} className="text-indigo-600" /> : <ChevronDown size={24} className="text-slate-300" />}
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
                      className="border-t border-slate-50"
                    >
                      <div className="p-8 bg-slate-50/50">
                        <div className="mb-6 flex items-center justify-between">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                             <ImageIcon size={14} /> Attachment Previews ({group.images?.length || 0})
                           </p>
                           <p className="text-xs font-black text-emerald-600 sm:hidden">₹{Number(group.bill_amount).toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {group.images?.length > 0 ? group.images.map((img: any, i: number) => (
                            <motion.div 
                              key={i}
                              whileHover={{ scale: 1.05 }}
                              className="aspect-square rounded-2xl overflow-hidden border border-white shadow-lg relative group/img"
                            >
                               <img 
                                src={`${FILE_BASE_URL}${img.image_url}`} 
                                alt={`Spare ${i}`} 
                                className="w-full h-full object-cover"
                                onClick={() => window.open(`${FILE_BASE_URL}${img.image_url}`, '_blank')}
                               />
                               <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Plus size={24} className="text-white" />
                               </div>
                            </motion.div>
                          )) : (
                            <div className="col-span-full py-8 text-center text-slate-300">
                               <p className="text-[10px] font-black uppercase italic tracking-widest">No images available</p>
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
