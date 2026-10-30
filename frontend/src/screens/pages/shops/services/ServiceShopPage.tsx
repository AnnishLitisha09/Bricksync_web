import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Filter,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
  Wrench,
  ChevronLeft
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="space-y-6 animate-in font-sans">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ChevronLeft size={12} /> Partner Network
            </button>
            <span className="text-xs font-bold text-slate-400">• {shops.length} Workshops</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Service <span className="text-indigo-600">Workshops</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Mechanics, maintenance shops, and repair ledger settlements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search workshop or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`h-10 px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showFilter
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>

          <button
            onClick={() => navigate("/shop/services/add")}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Workshop</span>
          </button>
        </div>
      </div>

      {/* ─── FILTER CHIPS ─── */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-2">
              {[
                { label: "All Hubs", value: "ALL" },
                { label: "> ₹10,000 Dues", value: "10000" },
                { label: "> ₹20,000 Dues", value: "20000" },
                { label: "> ₹50,000 Dues", value: "50000" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setAmountFilter(f.value as AmountFilter)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    amountFilter === f.value
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                      : "bg-white border-slate-200/80 text-slate-600 hover:border-indigo-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SHOP LISTING ─── */}
      <div>
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl font-bold text-xs border border-rose-200 mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200/80 animate-pulse" />
            ))
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredShops.map((s, idx) => (
                <motion.div
                  layout
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/shop/services/history?shopId=${s.id}&shopName=${encodeURIComponent(s.shop_name)}`)}
                  className="group bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                          <Wrench size={22} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                            {s.shop_name}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mt-0.5">
                            <User size={12} className="text-slate-400 shrink-0" />
                            <span className="truncate">Managed by {s.owner}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0">
                        {s.type || "General"}
                      </span>
                    </div>

                    {/* Contact & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Phone size={13} className="text-indigo-600 shrink-0" />
                        <span className="truncate">{s.phone || "No Contact"}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{s.address || "No Address"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dues Outstanding Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dues Outstanding</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">₹{s.amount?.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Service History</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {filteredShops.length === 0 && !loading && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search size={20} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Workshops Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or amount filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
