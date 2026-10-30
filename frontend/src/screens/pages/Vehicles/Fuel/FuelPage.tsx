import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Droplets,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore } from "../../../../store/vechicle/useVehicleStore";
import { useFuelStore } from "../../../../store/fuel/useFuelStore";
import LottieLoader from "../../../../components/common/LottieLoader";

export default function FuelPage() {
  const navigate = useNavigate();
  const {
    fuels,
    getFuels,
    searchFuels,
    loading,
    totalPages,
    currentPage,
    toggleFuelStatus,
    deleteFuel
  } = useFuelStore();

  const { fetchVehicles } = useVehicleStore();
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({ show: false, fuelId: null as number | null });
  const [deleteModal, setDeleteModal] = useState({ show: false, fuelId: null as number | null });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search) {
        searchFuels(search);
      } else {
        getFuels(1);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, searchFuels, getFuels]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleVerifyFuel = async () => {
    if (confirmModal.fuelId === null) return;
    await toggleFuelStatus(confirmModal.fuelId);
    setConfirmModal({ show: false, fuelId: null });
  };

  const handleDeleteFuel = async () => {
    if (deleteModal.fuelId === null) return;
    await deleteFuel(deleteModal.fuelId);
    setDeleteModal({ show: false, fuelId: null });
  };

  const statusStyles = {
    verified: "bg-emerald-100 text-emerald-700 border-emerald-200 cursor-default",
    pending: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 transition-all cursor-pointer active:scale-95",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 animate-in font-sans"
    >
      {/* MODALS (Shared Backdrop Logic) */}
      <AnimatePresence>
        {(confirmModal.show || deleteModal.show) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-sm shadow-2xl text-center"
            >
              {confirmModal.show ? (
                <>
                  <div className="size-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertCircle size={28} /></div>
                  <h3 className="text-lg font-black text-slate-800">Verify Record?</h3>
                  <p className="text-slate-500 text-xs mt-1.5 font-medium">Mark as verified to confirm this fuel bill entry.</p>
                  <div className="flex gap-2.5 mt-6">
                    <button onClick={() => setConfirmModal({ show: false, fuelId: null })} className="flex-1 h-10 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer">Cancel</button>
                    <button onClick={handleVerifyFuel} className="flex-1 h-10 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer">Verify Now</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={28} /></div>
                  <h3 className="text-lg font-black text-slate-800">Delete Record?</h3>
                  <p className="text-slate-500 text-xs mt-1.5 font-medium">This action cannot be undone. The fuel entry will be removed permanently.</p>
                  <div className="flex gap-2.5 mt-6">
                    <button onClick={() => setDeleteModal({ show: false, fuelId: null })} className="flex-1 h-10 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer">Go Back</button>
                    <button onClick={handleDeleteFuel} className="flex-1 h-10 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer">Delete Log</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Fuel <span className="text-indigo-600">Records</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Monitoring fleet fuel consumption, bunk entries & bill payments</p>
        </div>
        <button
          onClick={() => navigate("/vehicles/fuel/add")}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Add Fuel Record</span>
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Volume"
          value={`${fuels.reduce((acc, curr) => acc + (curr.volume || 0), 0).toLocaleString()} L`}
          icon={<Droplets className="text-indigo-600 size-5" />}
        />
        <StatCard
          title="Total Expense"
          value={`₹${fuels.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}`}
          icon={<CreditCard className="text-emerald-600 size-5" />}
        />
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-3 rounded-2xl shadow-2xs border border-slate-200/80">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search Vehicle Number or Bunk..."
            value={search}
            onChange={(e) => setSearch(e.target.value.toUpperCase())}
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* DATA VIEW */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <LottieLoader
            type="truck"
            message="Logging Fuel Consumption"
            size={250}
          />
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">Details</th>
                  <th className="px-4 py-4 text-left">Quantity</th>
                  <th className="px-4 py-4 text-left">Bill Amount</th>
                  <th className="px-4 py-4 text-left">Log Date</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fuels.map((fuel) => (
                  <tr key={fuel.fuelId} className="group hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-800 text-sm uppercase leading-tight">{fuel.vehicle?.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">{fuel.fuelBunk?.bunkName || "N/A"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[11px] font-black italic">
                        {fuel.volume} L
                      </span>
                    </td>
                    <td className="px-4 py-4 font-black text-slate-700 text-sm">₹{fuel.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-500 font-medium text-[11px]">
                      {new Date(fuel.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        disabled={fuel.isVerified}
                        onClick={() => setConfirmModal({ show: true, fuelId: fuel.fuelId })}
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all whitespace-nowrap ${statusStyles[fuel.isVerified ? 'verified' : 'pending']}`}
                      >
                        {fuel.isVerified ? "Verified" : "Verify Now"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteModal({ show: true, fuelId: fuel.fuelId })}
                        className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && !search && totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => { getFuels(currentPage - 1); window.scrollTo(0, 0); }}
            className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl"
          >
            <ChevronLeft size={20} /> Previous
          </button>

          <div className="flex gap-1.5 overflow-x-auto max-w-full py-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => { getFuels(i + 1); window.scrollTo(0, 0); }}
                className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white shadow-md" : "bg-gray-50 text-slate-400"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => { getFuels(currentPage + 1); window.scrollTo(0, 0); }}
            className="hidden md:flex items-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}

      {!loading && fuels.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-slate-400 text-sm font-bold">No Records Found</p>
        </div>
      )}
    </motion.div>
  );
}

// Updated StatCard for better mobile alignment
function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 overflow-hidden">
      <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-2xl shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-wider truncate">{title}</p>
        <p className="text-sm md:text-xl font-black text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}