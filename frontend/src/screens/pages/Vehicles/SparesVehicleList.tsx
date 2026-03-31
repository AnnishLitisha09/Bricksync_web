import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchVehicles } from "../../../api/vehicle";
import { Truck, ChevronRight, Loader2, ArrowLeft, Package } from "lucide-react";
import { motion } from "framer-motion";

const SparesVehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles()
      .then((res) => {
        setVehicles(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-4"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
              Vehicle <span className="text-indigo-600">Spares</span>
            </h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2">
              Browse services and parts by vehicle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/vehicle/spares/${v.id}`, { state: { vehicleNumber: v.vehicleNumber } })}
              className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 cursor-pointer group hover:border-indigo-500/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Vehicle No.</p>
                  <h3 className="text-xl font-black text-slate-900">{v.vehicleNumber}</h3>
                </div>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-slate-400">
                  <Package size={14} />
                  <span className="text-xs font-bold">Service Records</span>
                </div>
                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SparesVehicleList;
