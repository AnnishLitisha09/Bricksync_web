import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, CreditCard,
  Loader2, MapPin, Plus, Search, Trash2, Wrench
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleServiceStore } from "../../../../store/services/useVehicleServiceStore";

export default function ServicePage() {
  const navigate = useNavigate();
  const {
    services, fetchServices, searchServices,
    loading, totalPages, currentPage, deleteService
  } = useVehicleServiceStore();

  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null as number | null });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        searchServices(search);
      } else {
        fetchServices(1);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, searchServices, fetchServices]);

  const handleDelete = async () => {
    if (deleteModal.id) {
      await deleteService(deleteModal.id);
      setDeleteModal({ show: false, id: null });
    }
  };

  const typeStyles: Record<string, string> = {
    showroom: "bg-blue-100 text-blue-700 border-blue-200",
    paint: "bg-purple-100 text-purple-700 border-purple-200",
    tyre: "bg-emerald-100 text-emerald-700 border-emerald-200",
    others: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const totalSpent = services.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6 pb-24 md:pb-8"
    >
      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
              <div className="p-3 bg-red-50 text-red-600 rounded-full w-fit mx-auto mb-4"><Trash2 size={32} /></div>
              <h3 className="text-xl font-black text-slate-800">Delete Record?</h3>
              <p className="text-slate-500 text-sm mt-2">This will permanently remove this service record.</p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setDeleteModal({ show: false, id: null })} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 bg-gray-100">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-600">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
            Service <span className="text-orange-600 italic">Records</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">Manage your vehicle maintenance history</p>
        </div>
        <button
          onClick={() => navigate("/vehicles/services/add")}
          className="hidden md:flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} /> Add Service
        </button>
      </div>

      {/* STATS - Consolidated Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Count"
          value={services.length.toString()}
          icon={<Wrench className="text-orange-500" size={18} />}
        />
        <StatCard
          title="Total Spent"
          value={`₹${totalSpent.toLocaleString()}`}
          icon={<CreditCard className="text-emerald-500" size={18} />}
        />
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-2 md:p-4 rounded-[2rem] shadow-sm border border-gray-100">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search Vehicle (e.g. TN59)..."
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-gray-50 border-none rounded-[1.5rem] text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-slate-400 font-medium">Fetching records...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No records found.</div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5">Vehicle & Shop</th>
                    <th className="px-6 py-5">Type</th>
                    <th className="px-6 py-5">Amount</th>
                    <th className="px-6 py-5">Service Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map((service) => (
                    <tr key={service.id} className="group hover:bg-orange-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-800 text-sm uppercase">{service.vehicle?.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          <MapPin size={10} /> {service.serviceShop?.shop_name}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${typeStyles[service.serviceShop?.type] || typeStyles.others}`}>
                          {service.serviceShop?.type}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-black text-slate-700">₹{service.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 text-slate-500 font-medium text-xs">
                        {new Date(service.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => setDeleteModal({ show: true, id: service.id })}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST VIEW */}
            <div className="md:hidden divide-y divide-gray-50">
              {services.map((service) => (
                <div key={service.id} className="p-5 flex flex-col gap-4 active:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">{service.vehicle?.vehicleNumber}</h4>
                      <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-orange-500" /> {service.serviceShop?.shop_name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${typeStyles[service.serviceShop?.type] || typeStyles.others}`}>
                      {service.serviceShop?.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-black text-slate-400">Amount</span>
                      <span className="text-sm font-black text-slate-700">₹{service.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-200 pl-3">
                      <span className="text-[9px] uppercase font-black text-slate-400">Date</span>
                      <span className="text-sm font-bold text-slate-600">
                        {new Date(service.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteModal({ show: true, id: service.id })}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-xl text-xs font-bold"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MOBILE FLOATING ACTION BUTTON */}
      <button
        onClick={() => navigate("/vehicles/services/add")}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50 border-4 border-white"
      >
        <Plus size={28} />
      </button>

      {/* PAGINATION */}
      {!loading && !search && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => { fetchServices(currentPage - 1); window.scrollTo(0, 0); }}
            className="w-full sm:w-auto flex items-center justify-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl"
          >
            <ChevronLeft size={20} /> Prev
          </button>

          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => { fetchServices(i + 1); window.scrollTo(0, 0); }}
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${currentPage === i + 1 ? "bg-orange-600 text-white shadow-lg" : "bg-gray-50 text-slate-400"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => { fetchServices(currentPage + 1); window.scrollTo(0, 0); }}
            className="w-full sm:w-auto flex items-center justify-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-3">
      <div className="p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[8px] md:text-[10px] font-black uppercase tracking-wider truncate mb-0.5">{title}</p>
        <p className="text-sm md:text-xl font-black text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}