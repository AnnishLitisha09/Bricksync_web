import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Wrench, 
  ChevronRight,
  User,
  X,
  Hammer,
  ArrowUpRight,
  Settings,
  ShieldCheck
} from "lucide-react";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";

type AmountFilter = "ALL" | "10000" | "20000" | "50000";

export default function ServiceShopPage() {
  const navigate = useNavigate();
  const { shops, loading, error, fetchShops } = useServiceShopStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("ALL");

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const filteredShops = shops.filter((s) => {
    const matchSearch =
      s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchTerm.toLowerCase());

    let matchAmount = true;
    if (amountFilter === "10000") matchAmount = s.amount >= 10000;
    if (amountFilter === "20000") matchAmount = s.amount >= 20000;
    if (amountFilter === "50000") matchAmount = s.amount >= 50000;

    return matchSearch && matchAmount;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-10"
    >
      {/* PREMIUM HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-100">
                <Wrench className="text-white" size={24} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                SERVICE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 italic">HUBS</span>
             </h1>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] pl-1">Maintenance & Workshop Network</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search workshops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold text-slate-600 w-full md:w-72"
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${showFilter ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            onClick={() => navigate("/shop/services/add")}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Add Workshop
          </button>
        </div>
      </div>

      {/* GLASSMOPHISM FILTER CHIPS */}
      <AnimatePresence>
        {showFilter && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white flex flex-wrap gap-3">
              {[
                { label: "All Hubs", value: "ALL" },
                { label: "> ₹10,000", value: "10000" },
                { label: "> ₹20,000", value: "20000" },
                { label: "> ₹50,000", value: "50000" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setAmountFilter(f.value as AmountFilter)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${amountFilter === f.value ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHOP LISTING */}
      <div className="max-w-7xl mx-auto">
        {error && <div className="p-8 bg-red-50 text-red-500 rounded-3xl font-bold text-center border-2 border-red-100 uppercase tracking-widest text-xs">{error}</div>}

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-44 bg-white/50 animate-pulse rounded-[3rem]" />)
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredShops.map((s, idx) => (
                <motion.div
                  layout
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/shop/services/history?shopId=${s.id}&shopName=${encodeURIComponent(s.shop_name)}`)}
                  className="group relative bg-white rounded-[2.5rem] p-2 pr-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* ICON BOX */}
                    <div className="relative w-full md:w-48 h-40 bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 flex items-center justify-center m-2 shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Wrench size={48} className="text-slate-200 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500" />
                      <div className="absolute bottom-3 flex gap-1">
                         <div className="w-1 h-1 rounded-full bg-emerald-500" />
                         <div className="w-1 h-1 rounded-full bg-emerald-300" />
                         <div className="w-1 h-1 rounded-full bg-emerald-100" />
                      </div>
                    </div>

                    {/* DETAILS BOX */}
                    <div className="flex-1 w-full py-4 space-y-6">
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors uppercase">
                              {s.shop_name}
                            </h2>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                               {s.type || 'General'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                             <User size={14} className="text-emerald-500" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Managed by {s.owner}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dues Outstanding</p>
                                <div className="flex items-center gap-2">
                                    <Hammer size={16} className="text-slate-300" />
                                    <span className="text-3xl font-black text-slate-900 tabular-nums">
                                        ₹{s.amount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <ArrowUpRight size={20} />
                            </div>
                        </div>
                      </div>

                      {/* INFO GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                           <div className="p-2 bg-white shadow-sm rounded-xl text-emerald-500">
                              <Phone size={14} />
                           </div>
                           <span className="text-xs font-black text-slate-600 tracking-tight">{s.phone}</span>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                           <div className="p-2 bg-white shadow-sm rounded-xl text-teal-500">
                              <MapPin size={14} />
                           </div>
                           <span className="text-xs font-black text-slate-600 tracking-tight truncate max-w-[200px]">{s.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* HIDDEN ACTIONS ON DESKTOP */}
                    <div className="hidden lg:flex flex-col gap-2">
                         <div className="p-2 text-slate-200 group-hover:text-emerald-200 transition-colors">
                            <Settings size={20} />
                         </div>
                         <div className="p-2 text-slate-200 group-hover:text-emerald-500 transition-colors">
                            <ChevronRight size={24} />
                         </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {filteredShops.length === 0 && !loading && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} className="text-slate-300" />
               </div>
               <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No workshops found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}