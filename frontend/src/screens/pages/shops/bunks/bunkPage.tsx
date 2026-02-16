import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Fuel, 
  ChevronRight,
  User,
  CreditCard,
  ArrowUpRight,
  ExternalLink,
  Info
} from "lucide-react";
import { useBunkStore } from "../../../../store/useBunkStore";

type AmountFilter = "ALL" | "10000" | "20000" | "50000";

const BRAND_LOGOS: Record<string, string> = {
  "indian oil": "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Indian_Oil_Logo.svg/1200px-Indian_Oil_Logo.svg.png",
  "hp": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/Hindustan_Petroleum_Logo.svg/1200px-Hindustan_Petroleum_Logo.svg.png",
};

export default function BunkPage() {
  const navigate = useNavigate();
  const { bunks, loading, error, fetchBunks } = useBunkStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("ALL");

  useEffect(() => {
    fetchBunks();
  }, [fetchBunks]);

  const getBrandLogo = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("indian oil")) return BRAND_LOGOS["indian oil"];
    if (lower.includes("hp")) return BRAND_LOGOS["hp"];
    return null;
  };

  const filteredBunks = bunks.filter((b) => {
    const matchSearch =
      b.bunkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

    let matchAmount = true;
    if (amountFilter === "10000") matchAmount = b.amount >= 10000;
    if (amountFilter === "20000") matchAmount = b.amount >= 20000;
    if (amountFilter === "50000") matchAmount = b.amount >= 50000;

    return matchSearch && matchAmount;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-10"
    >
      {/* GLOSSY HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-200">
                <Fuel className="text-white" size={24} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                FUEL <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500 italic">NET</span>
             </h1>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] pl-1">Vendor Credit Ecosystem</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none font-bold text-slate-600 w-full md:w-72"
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
            onClick={() => navigate("/shop/bunks/add")}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-orange-600 hover:shadow-orange-200 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Register Bunk
          </button>
        </div>
      </div>

      {/* DYNAMIC FILTER CHIPS */}
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
                { label: "Full Network", value: "ALL" },
                { label: "> 10K Credits", value: "10000" },
                { label: "> 20K Credits", value: "20000" },
                { label: "> 50K Credits", value: "50000" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setAmountFilter(f.value as AmountFilter)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${amountFilter === f.value ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto">
        {error && (
            <div className="p-10 bg-red-50/50 backdrop-blur-md text-red-600 rounded-[3rem] font-black text-center border-2 border-dashed border-red-200 uppercase tracking-widest text-xs">
                {error}
            </div>
        )}

        <div className="grid grid-cols-1 gap-8">
            {loading ? (
            [1,2,3].map(i => <div key={i} className="h-44 bg-white/40 animate-pulse rounded-[3rem] border border-white" />)
            ) : (
            <AnimatePresence mode="popLayout">
                {filteredBunks.map((b, idx) => {
                const logo = getBrandLogo(b.bunkName);
                const isLowCredit = (b.amount || 0) < 5000;

                return (
                    <motion.div
                        layout
                        key={b.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(`/shop/bunks/history?bunkId=${b.id}&bunkName=${encodeURIComponent(b.bunkName)}`)}
                        className="group relative bg-white rounded-[3rem] p-2 pr-8 shadow-sm border border-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all overflow-hidden cursor-pointer"
                    >
                        {/* Decorative background glow for low credit */}
                        {isLowCredit && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full -mr-16 -mt-16" />}

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* BRAND IDENTITY BOX */}
                            <div className="relative w-full md:w-56 h-44 bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center m-2">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/10 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <div className="bg-white p-3 rounded-full shadow-xl">
                                        <ExternalLink size={20} className="text-slate-900" />
                                    </div>
                                </div>
                                {logo ? (
                                    <img src={logo} alt={b.bunkName} className="w-28 h-28 object-contain relative z-0 group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center">
                                        <Fuel size={40} className="text-slate-200" />
                                    </div>
                                )}
                            </div>

                            {/* CORE DETAILS */}
                            <div className="flex-1 w-full py-4 space-y-6">
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{b.bunkName}</h2>
                                            {isLowCredit && (
                                                <span className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                                                    Low Credit
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <User size={14} className="text-orange-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{b.ownerName}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Credits</p>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                                                    <CreditCard size={18} />
                                                </div>
                                                <span className="text-3xl font-black text-slate-900 tabular-nums">
                                                    ₹{b.amount?.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:flex p-4 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT & LOCATION GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-orange-100 transition-all">
                                        <div className="p-2 bg-white shadow-sm rounded-xl text-orange-500">
                                            <Phone size={14} />
                                        </div>
                                        <p className="text-xs font-black text-slate-600 tracking-tight">{b.phoneNumber || "No Contact Link"}</p>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-emerald-100 transition-all">
                                        <div className="p-2 bg-white shadow-sm rounded-xl text-emerald-500">
                                            <MapPin size={14} />
                                        </div>
                                        <p className="text-xs font-black text-slate-600 tracking-tight truncate max-w-[200px]">{b.address || "Address Unmapped"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* DESKTOP SIDE ACTION */}
                            <div className="hidden lg:flex flex-col gap-2">
                                <button className="p-3 text-slate-300 hover:text-orange-500 transition-colors">
                                    <Info size={20} />
                                </button>
                                <div className="p-3 text-slate-300 group-hover:text-orange-500 transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
                })}
            </AnimatePresence>
            )}

            {filteredBunks.length === 0 && !loading && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500 blur-3xl opacity-20 rounded-full" />
                        <div className="relative w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center mb-6">
                            <Search size={40} className="text-slate-200" />
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Stations Found</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Try adjusting your search or filters</p>
                </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  );
}