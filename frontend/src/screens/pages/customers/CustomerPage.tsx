import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShieldCheck, Users, Phone, ExternalLink, Loader2,
  Plus, X, Pencil, Trash2, AlertTriangle, Upload, CheckCircle2,
  ListFilter, Download, LayoutGrid, List, MoreVertical, IndianRupee,
  TrendingUp, UserCircle2
} from "lucide-react";
import type { CustomerData } from "../../../store/customers/useCustomerStore";
import { useCustomerStore } from "../../../store/customers/useCustomerStore";
import { bulkCreateCustomers } from "../../../api/customer";
import { parseCustomerPdf, type ParsedCustomer } from "../../../utils/parseCustomerPdf";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ExportCustomerModal from "./ExportCustomerModal";


// Grey-anchored palette — only Avatar keeps colour
const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
];
const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

/* ─────────────────────────────────────────────────── */

const CustomerHub: React.FC = () => {
  const navigate = useNavigate();
  const { customers, totalCustomers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomerStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [entryMode, setEntryMode] = useState<"manual" | "bulk">("manual");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); setHasMore(true); fetchCustomers(search, 1, true, false, sortBy, sortOrder); }, 300);
    return () => clearTimeout(t);
  }, [search, sortBy, sortOrder]);

  useEffect(() => { setHasMore(customers.length < totalCustomers); }, [customers.length, totalCustomers]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const next = page + 1; setPage(next);
    await fetchCustomers(search, next, false, true, sortBy, sortOrder);
  }, [loading, hasMore, page, search, sortBy, sortOrder, fetchCustomers]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, [loadMore]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false); };
    const c = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('[data-menu]')) setActiveMenu(null); };
    document.addEventListener("mousedown", h);
    document.addEventListener("click", c);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("click", c); };
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    if (formData.phone_no && !/^\d{10}$/.test(formData.phone_no)) { toast.error("Phone must be 10 digits"); return; }
    setSubmitting(true);
    try {
      formData.id ? await updateCustomer(formData.id, formData) : await createCustomer(formData);
      toast.success(formData.id ? "Client updated!" : "Client created!");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
    } catch (err: any) { toast.error(err.message || "Error"); }
    finally { setSubmitting(false); }
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null; setBulkFile(file); setParsedCustomers([]);
    if (!file) return; setIsParsing(true);
    try { const r = await parseCustomerPdf(file); setParsedCustomers(r); toast.success(`Parsed ${r.length} clients`); }
    catch (err: any) { toast.error("Parse error: " + err.message); }
    finally { setIsParsing(false); }
  };

  const handleBulkSubmit = async () => {
    if (!parsedCustomers.length) return; setSubmitting(true);
    try { await bulkCreateCustomers(parsedCustomers as any); toast.success(`Imported ${parsedCustomers.length} clients!`); setIsModalOpen(false); fetchCustomers("", 1, true); }
    catch (err: any) { toast.error(err.message || "Import failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return; setSubmitting(true);
    try { await deleteCustomer(deleteId); toast.success("Client deleted!"); setDeleteId(null); }
    catch { toast.error("Delete failed"); }
    finally { setSubmitting(false); }
  };

  const lc = "text-[10px] font-black text-slate-400 uppercase tracking-wider";
  const ic = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 outline-none transition text-sm font-medium text-slate-700";

  const totalBalance = customers.reduce((s, c) => s + Number(c.balance || 0), 0);
  const dueCount = customers.filter(c => Number(c.balance) > 0).length;

  return (
    <div className="p-4 md:p-8 lg:p-10 min-h-screen bg-[#F7F8FA] space-y-6 md:space-y-8 font-sans max-w-[1600px] mx-auto">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-slate-500 font-bold text-[10px] uppercase tracking-widest">
            <ShieldCheck size={11} /> Secure Ledger
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Client <span className="text-slate-500">Hub</span>
          </h1>
          <p className="text-slate-400 text-sm">Manage accounts &amp; outstanding balances</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <Users size={14} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Accounts</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{loading && !customers.length ? "—" : totalCustomers}</p>
            </div>
          </div>

          <button onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition shadow-sm flex items-center gap-2 text-sm">
            <Download size={15} /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => { setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" }); setIsModalOpen(true); }}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-700 text-white rounded-2xl shadow-sm transition font-bold flex items-center gap-2 text-sm">
            <Plus size={16} /><span className="hidden sm:inline">Add Client</span><span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ─── STATS ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Clients */}
        <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-5 shadow-sm flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <Users size={14} className="text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">Clients</p>
            <p className="text-base sm:text-2xl font-black text-slate-900 leading-tight">{totalCustomers}</p>
          </div>
        </div>

        {/* Due */}
        <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-5 shadow-sm flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">Due</p>
            <p className="text-base sm:text-2xl font-black text-slate-700 leading-tight">{dueCount}</p>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-5 shadow-sm flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <IndianRupee size={14} className="text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider truncate">Balance</p>
            <p className="text-sm sm:text-xl font-black text-emerald-600 leading-tight truncate">₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* ─── SEARCH + CONTROLS ─── */}
      <div className="flex items-center gap-2">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-600 transition-colors" size={16} />
          <input type="text" placeholder="Search clients by name or phone..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none font-medium text-slate-700 transition-all text-sm placeholder:text-slate-300" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"><X size={15} /></button>}
        </div>

        {/* Sort */}
        <div className="relative shrink-0" ref={sortMenuRef}>
          <button onClick={() => setShowSortMenu(!showSortMenu)}
            className={`p-3 rounded-2xl border transition-all ${showSortMenu ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm'}`}>
            <ListFilter size={16} />
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div initial={{ opacity: 0, y: 6, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .97 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-slate-100 shadow-xl z-50 py-2">
                {[["Name A→Z", "name", "ASC"], ["Name Z→A", "name", "DESC"], ["Balance ↓", "amount", "DESC"]].map(([l, f, o]) => (
                  <button key={l} onClick={() => { setSortBy(f); setSortOrder(o); setShowSortMenu(false); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-colors ${sortBy === f && sortOrder === o ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                    {l} {sortBy === f && sortOrder === o && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="hidden lg:flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={15} /></button>
          <button onClick={() => setViewMode("table")} className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'}`}><List size={15} /></button>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading clients...</p>
        </div>
      ) : (
        <>
          {/* ── GRID ── */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {customers.map((c, i) => (
                  <motion.div layout key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.04, 0.3) } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -5, transition: { duration: 0.18, ease: "easeOut" } }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/80 hover:border-slate-200 transition-shadow group overflow-hidden cursor-default"
                  >
                    {/* Card top */}
                    <div className="p-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Coloured avatar */}
                        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${getAvatarColor(c.name)} flex items-center justify-center text-white font-black text-base shrink-0 shadow-md shadow-slate-200 group-hover:scale-110 transition-transform duration-200`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-800 text-sm truncate max-w-[150px] group-hover:text-slate-900 transition-colors uppercase tracking-tight" title={c.name}>{c.name}</h3>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 truncate">{c.category || "Other"}</p>
                        </div>
                      </div>

                      {/* 3-dot */}
                      <div data-menu className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id!)}
                          className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        <AnimatePresence>
                          {activeMenu === c.id && (
                            <motion.div data-menu initial={{ opacity: 0, y: 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .96 }}
                              className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-30 py-1.5">
                              <button onClick={() => { navigate(`/customer/details/${c.id}`); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5"><ExternalLink size={12} className="text-slate-400" /> View Ledger</button>
                              <button onClick={() => { setFormData(c); setIsModalOpen(true); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5"><Pencil size={12} className="text-slate-400" /> Edit</button>
                              <button onClick={() => { setDeleteId(c.id!); setActiveMenu(null); }}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5"><Trash2 size={12} className="text-red-400" /> Delete</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-5 border-t border-slate-50" />

                    {/* Details */}
                    <div className="px-5 py-4 space-y-3">
                      {/* Phone */}
                      <div className="flex items-center gap-2.5">
                        <Phone size={12} className="text-slate-300 shrink-0" />
                        <span className="text-xs font-medium text-slate-400 truncate">{c.phone_no || "—"}</span>
                      </div>

                      {/* Balance — green text, no background */}
                      <div className="flex items-center gap-2.5">
                        <IndianRupee size={12} className={Number(c.balance) > 0 ? "text-emerald-500" : "text-slate-300"} />
                        <span className={`text-sm font-black ${Number(c.balance) > 0 ? "text-emerald-500" : "text-slate-400"}`}>
                          ₹{Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {Number(c.balance) > 0 && <span className="text-[9px] font-black uppercase text-slate-400 ml-auto tracking-widest">Due</span>}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="px-5 pb-5">
                      <button onClick={() => navigate(`/customer/details/${c.id}`)}
                        className="w-full py-2.5 bg-slate-50 hover:bg-slate-900 text-slate-500 hover:text-white border border-slate-100 hover:border-slate-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 group/btn">
                        Open Ledger
                        <ExternalLink size={11} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* ── TABLE ── */}
          {viewMode === "table" && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[560px]">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {customers.map((c, i) => (
                        <motion.tr layout key={c.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }}
                          className="border-b border-slate-50/60 hover:bg-slate-50/40 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Gradient avatar in list view */}
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(c.name)} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-sm truncate max-w-[180px] group-hover:text-slate-900 transition-colors uppercase tracking-tight" title={c.name}>{c.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">BS-{c.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                              <Phone size={12} className="text-slate-300 shrink-0" />{c.phone_no || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">{c.category || "Other"}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {/* Green text, no background */}
                            <p className={`text-sm font-black tabular-nums ${Number(c.balance) > 0 ? "text-emerald-500" : "text-slate-400"}`}>
                              ₹{Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            {Number(c.balance) > 0 && <span className="text-[9px] font-black uppercase text-slate-400">Due</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => navigate(`/customer/details/${c.id}`)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all" title="View Ledger"><ExternalLink size={13} /></button>
                              <button onClick={() => { setFormData(c); setIsModalOpen(true); }} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => setDeleteId(c.id!)} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Delete"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty */}
          {customers.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-100">
              <UserCircle2 size={56} className="text-slate-200 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-black text-slate-600">No Clients Found</h2>
              <p className="text-slate-400 text-sm mt-1.5">Try a different search or add your first client.</p>
              <button onClick={() => setSearch("")} className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-700 transition text-sm">Clear Search</button>
            </motion.div>
          )}

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-8" />
          {loading && customers.length > 0 && <div className="flex justify-center py-5"><Loader2 className="animate-spin text-slate-400" size={22} /></div>}
          {!hasMore && customers.length > 0 && <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-3">All {totalCustomers} clients loaded</p>}
        </>
      )}

      {/* ─── ADD/EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-lg overflow-y-auto max-h-[96vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-slate-900">{formData.id ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><X size={17} /></button>
            </div>
            <div className="px-6 pt-5">
              <div className="flex p-1 bg-slate-100 rounded-2xl relative">
                <button onClick={() => setEntryMode("manual")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${entryMode === "manual" ? "text-slate-900" : "text-slate-400"}`}>Manual</button>
                <button onClick={() => setEntryMode("bulk")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${entryMode === "bulk" ? "text-slate-900" : "text-slate-400"}`}>Bulk Import</button>
                <motion.div className="absolute inset-1 bg-white rounded-xl shadow-sm" animate={{ x: entryMode === "manual" ? "0%" : "100%" }} style={{ width: "calc(50% - 4px)" }} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {entryMode === "manual" ? (
                <motion.form key="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                  <div><label className={lc}>Full Name *</label><input required type="text" className={`${ic} mt-1.5`} placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Phone</label><input maxLength={10} className={`${ic} mt-1.5`} placeholder="10-digit" value={formData.phone_no} onChange={e => setFormData({ ...formData, phone_no: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
                    <div><label className={lc}>Category</label><select className={`${ic} mt-1.5 appearance-none`} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}><option value="engineer">Engineer</option><option value="shop">Shop</option><option value="other">Other</option></select></div>
                  </div>
                  <div><label className={lc}>Email</label><input type="email" className={`${ic} mt-1.5`} placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                  {!formData.id && <div><label className={lc}>Initial Balance</label><input type="number" step="0.01" className={`${ic} mt-1.5`} placeholder="0.00" value={formData.balance === 0 ? '' : formData.balance} onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })} /></div>}
                  <div><label className={lc}>Address</label><textarea rows={2} className={`${ic} mt-1.5 resize-none`} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm transition-colors">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-700 flex items-center gap-2 text-sm transition-colors disabled:opacity-60">
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}{formData.id ? 'Update' : 'Save'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-5">
                  <div onClick={() => fileInputRef.current?.click()} className="group w-full py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center cursor-pointer hover:border-slate-400 hover:bg-slate-100/50 transition-all">
                    <div className="p-5 bg-white rounded-2xl shadow border border-slate-100 text-slate-500 group-hover:scale-105 transition-transform">
                      {isParsing ? <Loader2 size={26} className="animate-spin" /> : bulkFile ? <CheckCircle2 size={26} className="text-emerald-500" /> : <Upload size={26} />}
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-600 truncate px-4 text-center w-full">{isParsing ? "Parsing..." : bulkFile ? bulkFile.name : "Upload Consolidated PDF"}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">PDF format</p>
                    <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                  </div>
                  {parsedCustomers.length > 0 && (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found {parsedCustomers.length} clients</p>
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 text-xs">
                        <table className="w-full"><thead className="sticky top-0 bg-slate-100"><tr><th className="px-3 py-2 text-left font-black text-slate-500 text-[10px] uppercase">Name</th><th className="px-3 py-2 font-black text-slate-500 text-[10px] uppercase">Phone</th></tr></thead>
                          <tbody>{parsedCustomers.slice(0, 100).map((c, i) => <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2 font-bold text-slate-700 truncate max-w-[150px]">{c.name}</td><td className="px-3 py-2 text-slate-500">{c.phone_no}</td></tr>)}</tbody>
                        </table>
                      </div>
                      <button onClick={handleBulkSubmit} disabled={submitting} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-60">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}{submitting ? "Importing..." : `Import ${parsedCustomers.length} Clients`}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* ─── DELETE MODAL ─── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94, y: 12 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-7">
              <button onClick={() => setDeleteId(null)} className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><X size={16} /></button>
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500"><AlertTriangle size={28} /></div>
                <div><h3 className="text-lg font-black text-slate-800">Delete Client?</h3><p className="text-slate-400 text-sm mt-1">This will remove the client and all their records.</p></div>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => setDeleteId(null)} className="py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm transition-colors">Cancel</button>
                  <button onClick={handleDelete} disabled={submitting} className="py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                    {submitting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ExportCustomerModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
};

export default CustomerHub;