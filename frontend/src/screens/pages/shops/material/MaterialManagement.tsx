import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Filter,
  Info,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
  User,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// --- INTERFACES ---
interface ShopEntry {
  id: number;
  shopName: string;
  ownerName: string;
  phoneNumber: string;
  address: string;
  category: string;
  balance: number; 
  date: string;
}

export default function ShopLedgerPage() {
  const navigate = useNavigate();

  // --- SAMPLE DATA (Replace with useShopStore) ---
  const [entries] = useState<ShopEntry[]>([
    {
      id: 1,
      shopName: "Global Hardware & Tools",
      ownerName: "John Doe",
      phoneNumber: "+91 98765 43210",
      address: "123 Main St, Industrial Area",
      category: "Wholesale",
      balance: 45000,
      date: "2024-03-15"
    },
    {
      id: 2,
      shopName: "City Paints & Decor",
      ownerName: "Jane Smith",
      phoneNumber: "+91 88888 77777",
      address: "45 Business Park, West Wing",
      category: "Retail",
      balance: 3200,
      date: "2024-03-14"
    },
    {
      id: 3,
      shopName: "Metro Build-Mart",
      ownerName: "Mike Ross",
      phoneNumber: "+91 90000 12345",
      address: "Shop 12, South Plaza",
      category: "Distributor",
      balance: 125000,
      date: "2024-03-12"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = ["ALL", "Retail", "Wholesale", "Distributor", "Contractor"];

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return entries.filter((s) => {
      const matchSearch =
        s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "ALL" || s.category.toUpperCase() === activeCategory.toUpperCase();
      return matchSearch && matchCategory;
    });
  }, [entries, searchTerm, activeCategory]);

  // Navigation Handler
  const handleViewHistory = (shop: ShopEntry) => {
    // Navigates to the history page with query parameters
    navigate(`/shop/ledger/history?shopId=${shop.id}&shopName=${encodeURIComponent(shop.shopName)}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-10 font-sans"
    >
      <Toaster position="top-right" />

      {/* GLOSSY HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <Store className="text-white" size={24} />
             </div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                SHOP <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 italic">LEDGER</span>
             </h1>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] pl-1">Merchant Credit Directory</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-600 w-full md:w-72"
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
            onClick={() => navigate("/shop/ledger/add")}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Register Merchant
          </button>
        </div>
      </div>

      {/* DYNAMIC CATEGORY CHIPS */}
      <AnimatePresence>
        {showFilter && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-7xl mx-auto overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${activeCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="popLayout">
                {filteredEntries.map((shop, idx) => {
                const isHighBalance = shop.balance > 50000;

                return (
                    <motion.div
                        layout
                        key={shop.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => handleViewHistory(shop)}
                        className="group relative bg-white rounded-[3rem] p-2 pr-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all overflow-hidden cursor-pointer"
                    >
                        {isHighBalance && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />}

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            {/* ICON BOX */}
                            <div className="relative w-full md:w-56 h-44 bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center m-2 shrink-0">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <div className="bg-white p-3 rounded-full shadow-xl">
                                        <ExternalLink size={20} className="text-indigo-600" />
                                    </div>
                                </div>
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <Store size={40} className="text-indigo-100 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <div className="absolute bottom-4 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                                </div>
                            </div>

                            {/* CORE DETAILS */}
                            <div className="flex-1 w-full py-4 space-y-6">
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">{shop.shopName}</h2>
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                                                {shop.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <User size={14} className="text-indigo-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Managed by {shop.ownerName}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={18} className="text-slate-300" />
                                                <span className="text-3xl font-black tabular-nums text-slate-900">
                                                    ₹{shop.balance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* INFO GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                                        <div className="p-2 bg-white shadow-sm rounded-xl text-indigo-500">
                                            <Phone size={14} />
                                        </div>
                                        <p className="text-xs font-black text-slate-600 tracking-tight">{shop.phoneNumber}</p>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                                        <div className="p-2 bg-white shadow-sm rounded-xl text-teal-500">
                                            <MapPin size={14} />
                                        </div>
                                        <p className="text-xs font-black text-slate-600 tracking-tight truncate max-w-[200px]">{shop.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* SIDE ACTIONS */}
                            <div className="hidden lg:flex flex-col gap-2">
                                <div className="p-2 text-slate-200 group-hover:text-indigo-200 transition-colors">
                                    <Info size={20} />
                                </div>
                                <div className="p-2 text-slate-200 group-hover:text-indigo-500 transition-colors">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
                })}
            </AnimatePresence>

            {filteredEntries.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No merchants found</p>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}