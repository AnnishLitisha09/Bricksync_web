import { AnimatePresence, motion } from "framer-motion";
import {
  CreditCard,
  Package,
  Plus,
  Search,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Truck
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSpares, deleteSparesEntry } from "../../../api/spares";
import { FILE_BASE_URL } from "../../../api/base";
import LottieLoader from "../../../components/common/LottieLoader";
import { toast } from "react-hot-toast";

export default function SparesLogPage() {
  const navigate = useNavigate();
  const [spares, setSpares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, spareId: null as number | null });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchSpares();
  }, []);

  const fetchSpares = async () => {
    setLoading(true);
    try {
      const res = await getAllSpares();
      setSpares(res.data);
    } catch (error) {
      toast.error("Failed to fetch spare records");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpare = async () => {
    if (deleteModal.spareId === null) return;
    try {
      await deleteSparesEntry(deleteModal.spareId);
      toast.success("Record deleted successfully");
      fetchSpares();
    } catch (error) {
      toast.error("Failed to delete record");
    } finally {
      setDeleteModal({ show: false, spareId: null });
    }
  };

  const filteredSpares = (Array.isArray(spares) ? spares : []).filter(spare => {
    if (!spare) return false;
    const matchesGeneral = !search || (spare.name?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesVehicle = !vehicleSearch || (spare.vehicle?.vehicleNumber?.toLowerCase() || "").includes(vehicleSearch.toLowerCase());
    return matchesGeneral && matchesVehicle;
  });

  const totalExpenditure = filteredSpares.reduce((acc, curr) => acc + (Number(curr?.bill_amount) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-3 md:p-8 space-y-4 md:space-y-6 relative font-sans"
    >
      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="p-4 bg-red-50 text-red-600 rounded-full w-fit mx-auto mb-4"><Trash2 size={32} /></div>
              <h3 className="text-xl font-black text-slate-800">Delete Record?</h3>
              <p className="text-slate-500 text-sm mt-2">This action is permanent. The spare record will be removed forever.</p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setDeleteModal({ show: false, spareId: null })} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-gray-100 active:scale-95 transition-transform">Go Back</button>
                <button onClick={handleDeleteSpare} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-red-600 shadow-lg shadow-red-200 active:scale-95 transition-transform">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
            Spares <span className="text-indigo-600 italic">Log</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Tracking maintenance & spare parts across the fleet</p>
        </div>
        <button
          onClick={() => navigate("/vehicle/spares/add/new")}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-xl md:rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg active:scale-95 text-sm md:text-base"
        >
          <Plus size={18} /> Add Spares
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Total Expenditure"
          value={`₹${totalExpenditure.toLocaleString('en-IN')}`}
          icon={<CreditCard className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />}
        />
        <StatCard
          title="Total Records"
          value={filteredSpares.length.toString()}
          icon={<Package className="text-indigo-500 w-5 h-5 md:w-6 md:h-6" />}
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search Part or Service Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
            />
          </div>
          <div className="relative group">
            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Filter by Vehicle Number..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl md:rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* DATA VIEW */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 font-black uppercase tracking-widest text-xs">Loading Maintenance Logs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Vehicle Details</th>
                  <th className="px-4 py-4 text-left">Part/Service Name</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-center">Media</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSpares.slice(0, 100).map((spare) => (
                  <React.Fragment key={spare.id}>
                    <tr className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-800 text-sm uppercase leading-tight">{spare.vehicle?.vehicleNumber || "N/A"}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase">ID: BS-{spare.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-slate-700 capitalize">{spare.name}</div>
                      </td>
                      <td className="px-4 py-4 font-black text-emerald-600 text-sm">₹{Number(spare.bill_amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-slate-500 font-bold text-[11px] uppercase">
                        {new Date(spare.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setExpandedId(expandedId === spare.id ? null : spare.id)}
                          className={`p-2 rounded-xl transition-all ${expandedId === spare.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                          <ImageIcon size={18} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/vehicle/spares/${spare.vehicle_id}`)}
                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="View Vehicle History"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ show: true, spareId: spare.id })}
                            className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* EXPANDED ROW FOR IMAGES */}
                    <AnimatePresence>
                      {expandedId === spare.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-6 px-4 bg-slate-50/50 rounded-[2rem] my-4 border border-slate-100">
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                  {spare.images?.length > 0 ? spare.images.map((img: any, i: number) => (
                                    <div 
                                      key={i} 
                                      className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md relative group cursor-pointer"
                                      onClick={() => window.open(`${FILE_BASE_URL}${img.image_url}`, '_blank')}
                                    >
                                      <img src={`${FILE_BASE_URL}${img.image_url}`} alt="Spare" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <ExternalLink className="text-white" size={20} />
                                      </div>
                                    </div>
                                  )) : (
                                    <div className="col-span-full py-4 text-center text-slate-400 font-bold text-[10px] uppercase">
                                      No Digitized Attachments Available
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
                {filteredSpares.length > 100 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
                      Showing 100 of {filteredSpares.length} records. Please use search to find older records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filteredSpares.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
           <Package size={56} className="mx-auto text-slate-200 mb-4" />
           <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Archive Empty</p>
           <p className="text-slate-300 text-xs mt-2">No spare records found matching your criteria.</p>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl shrink-0 shadow-inner">{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest truncate">{title}</p>
        <p className="text-base md:text-xl font-black text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}
