import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle, ChevronLeft,
  ChevronRight,
  CreditCard,
  Droplets,
  Filter,
  Loader2,
  Plus,
  Search
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import { useFuelStore } from "../../../../store/useFuelStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";

// --- Types ---
interface ConfirmModalState {
  show: boolean;
  fuelId: number | null;
}

interface FilterProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  children?: React.ReactNode;
  type?: string;
}

export default function FuelPage() {
  const navigate = useNavigate();
  const { fuels, getFuels, loading } = useFuelStore();
  const { vehicles, fetchVehicles } = useVehicleStore();

  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [filters, setFilters] = useState({
    vehicleId: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ 
    show: false, 
    fuelId: null 
  });

  useEffect(() => {
    getFuels();
    fetchVehicles();
  }, [getFuels, fetchVehicles]);

  const handleVerifyFuel = async () => {
    if (confirmModal.fuelId === null) return;
    try {
      const response = await fetch(`${BASE_URL}/vehicle-fuels/${confirmModal.fuelId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      if (response.ok) {
        getFuels(); 
        setConfirmModal({ show: false, fuelId: null });
      }
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  const filteredFuels = useMemo(() => {
    return fuels.filter((fuel) => {
      let match = true;
      if (search) match = fuel.vehicle.vehicleNumber.toLowerCase().includes(search.toLowerCase());
      if (filters.vehicleId) match = match && fuel.vehicle.id === Number(filters.vehicleId);
      if (filters.status) match = match && fuel.status === filters.status;
      if (filters.startDate && filters.endDate) {
        const fuelDate = new Date(fuel.date).getTime();
        const start = new Date(filters.startDate).getTime();
        const end = new Date(filters.endDate).getTime();
        match = match && fuelDate >= start && fuelDate <= end;
      }
      return match;
    });
  }, [fuels, search, filters]);

  const totalPages = Math.ceil(filteredFuels.length / itemsPerPage);
  const currentData = filteredFuels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusStyles = {
    verified: "bg-emerald-100 text-emerald-700 border-emerald-200 cursor-default",
    not_verified: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 transition-all cursor-pointer active:scale-95",
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6 relative"
    >
      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Verify Record?</h3>
                <p className="text-slate-500 text-sm">Mark as verified to confirm this bill.</p>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setConfirmModal({ show: false, fuelId: null })} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 bg-gray-100">Cancel</button>
                <button onClick={handleVerifyFuel} className="flex-1 py-3 rounded-2xl font-bold text-white bg-orange-600">Verify</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">FUEL <span className="text-orange-600 italic">RECORDS</span></h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring fleet consumption & bills</p>
        </div>
        <button onClick={() => navigate("/vehicles/fuel/add")} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-xl active:scale-95">
          <Plus size={20} /> Add Record
        </button>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Volume" value={`${filteredFuels.reduce((acc, curr) => acc + (curr.volume || 0), 0).toLocaleString()} L`} icon={<Droplets className="text-blue-500" />} />
        <StatCard title="Total Expenditure" value={`₹${filteredFuels.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}`} icon={<CreditCard className="text-emerald-500" />} />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search vehicle number..."
              value={search}
              onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all ${
              showFilter ? "bg-orange-50 text-orange-600 ring-2 ring-orange-500" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Filter size={18} /> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dashed border-gray-200 mt-2">
                <FilterSelect label="Vehicle" value={filters.vehicleId} onChange={(v) => {setFilters({...filters, vehicleId: v}); setCurrentPage(1);}}>
                  <option value="">All Vehicles</option>
                  {vehicles.map(v => <option key={v.id} value={v.id.toString()}>{v.vehicleNumber}</option>)}
                </FilterSelect>
                <FilterSelect label="Status" value={filters.status} onChange={(v) => {setFilters({...filters, status: v}); setCurrentPage(1);}}>
                  <option value="">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="not_verified">Pending</option>
                </FilterSelect>
                <FilterInput label="From Date" type="date" value={filters.startDate} onChange={(v) => {setFilters({...filters, startDate: v}); setCurrentPage(1);}} />
                <FilterInput label="To Date" type="date" value={filters.endDate} onChange={(v) => {setFilters({...filters, endDate: v}); setCurrentPage(1);}} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DATA VIEW */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="text-slate-400 font-medium">Fetching fuel logs...</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left">Details</th>
                    <th className="px-6 py-5 text-left">Quantity</th>
                    <th className="px-6 py-5 text-left">Bill Amount</th>
                    <th className="px-6 py-5 text-left">Log Date</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentData.map((fuel) => (
                    <tr key={fuel.fuelId} className="group hover:bg-orange-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-800 text-sm uppercase">{fuel.vehicle.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-400 font-bold">{fuel.bunk.bunkName}</div>
                      </td>
                      <td className="px-6 py-5"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-black italic">{fuel.volume} L</span></td>
                      <td className="px-6 py-5 font-black text-slate-700">₹{fuel.amount.toLocaleString()}</td>
                      <td className="px-6 py-5 text-slate-500 font-medium text-xs">{new Date(fuel.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-5 text-center">
                        <button disabled={fuel.status === "verified"} onClick={() => setConfirmModal({ show: true, fuelId: fuel.fuelId })} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border transition-all ${statusStyles[fuel.status === 'verified' ? 'verified' : 'not_verified']}`}>
                          {fuel.status === "verified" ? "Verified" : "Pending"}
                        </button>
                      </td>
                      <td className="px-8 py-5 text-right"><button className="p-2 bg-gray-50 group-hover:bg-white rounded-xl text-slate-400 hover:text-orange-600 transition-all border border-transparent hover:border-orange-100"><ChevronRight size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW (UPDATED) */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentData.map((fuel, idx) => (
                <motion.div 
                  key={fuel.fuelId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-xs uppercase">
                        {fuel.vehicle.vehicleNumber.slice(-2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase leading-none">{fuel.vehicle.vehicleNumber}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">{fuel.bunk.bunkName}</p>
                      </div>
                    </div>
                    <button
                      disabled={fuel.status === "verified"}
                      onClick={() => setConfirmModal({ show: true, fuelId: fuel.fuelId })}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border ${statusStyles[fuel.status === 'verified' ? 'verified' : 'not_verified']}`}
                    >
                      {fuel.status === "verified" ? "Verified" : "Pending"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Volume</p>
                      <p className="font-black text-slate-700 text-xs italic">{fuel.volume} L</p>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100 col-span-1">
                      <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Amount</p>
                      <p className="font-black text-slate-700 text-xs">₹{fuel.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Date</p>
                      <p className="font-black text-slate-700 text-[10px]">
                        {new Date(fuel.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100 gap-4">
          <button disabled={currentPage === 1} onClick={() => {setCurrentPage(p => p - 1); window.scrollTo(0,0);}} className="w-full sm:w-auto flex items-center justify-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl">
            <ChevronLeft size={20} /> Prev
          </button>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => {setCurrentPage(i + 1); window.scrollTo(0,0);}} className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all ${currentPage === i + 1 ? "bg-orange-600 text-white shadow-lg" : "bg-gray-50 text-slate-400"}`}>
                {i + 1}
              </button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => {setCurrentPage(p => p + 1); window.scrollTo(0,0);}} className="w-full sm:w-auto flex items-center justify-center gap-1 text-sm font-bold text-slate-500 disabled:opacity-30 p-2 hover:bg-gray-50 rounded-xl">
            Next <ChevronRight size={20} />
          </button>
        </div>
      )}

      {!loading && filteredFuels.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
          <p className="text-slate-400 font-bold">No Records Found</p>
        </div>
      )}
    </motion.div>
  );
}

// --- Typed Helper Components ---

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: FilterProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function FilterInput({ label, type, value, onChange }: FilterProps) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 border-none rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-orange-500 outline-none"
      />
    </div>
  );
}