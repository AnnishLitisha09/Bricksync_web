import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShieldCheck, Users, Phone, ExternalLink, Loader2,
  Plus, X, Pencil, Trash2, AlertTriangle, Upload, CheckCircle2,
  ListFilter, Download, LayoutGrid, List, MoreVertical, IndianRupee,
  TrendingUp, UserCircle2, Package, RefreshCw, ChevronDown, Building2
} from "lucide-react";
import { getAllOffices } from "../../../api/inventory";
import type { CustomerData } from "../../../store/customers/useCustomerStore";
import { useCustomerStore } from "../../../store/customers/useCustomerStore";
import { bulkCreateCustomers } from "../../../api/customer";
import { parseCustomerPdf, type ParsedCustomer } from "../../../utils/parseCustomerPdf";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ExportCustomerModal from "./ExportCustomerModal";

// Palette — only Avatar keeps colour
const avatarColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-indigo-600 to-blue-600",
  "from-cyan-500 to-sky-600",
];
const getAvatarColor = (name: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

/* ─── ATTRACTIVE SKELETON LOADERS ─── */

const TableSkeletonRow: React.FC<{ index: number }> = ({ index }) => (
  <tr className="border-b border-slate-50/70 animate-pulse" style={{ animationDelay: `${index * 75}ms` }}>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200/80 shrink-0" />
        <div className="space-y-1.5 min-w-0">
          <div className="h-3.5 bg-slate-200/80 rounded-md w-36 sm:w-48" />
          <div className="h-2.5 bg-slate-100 rounded-md w-16" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-slate-200/60 shrink-0" />
        <div className="h-3 bg-slate-200/70 rounded-md w-24" />
      </div>
    </td>
    <td className="px-6 py-4 hidden md:table-cell">
      <div className="h-6 w-16 bg-slate-100/90 rounded-lg" />
    </td>
    <td className="px-6 py-4 text-right">
      <div className="flex flex-col items-end gap-1">
        <div className="h-4 bg-slate-200/80 rounded-md w-20" />
        <div className="h-2 bg-slate-100 rounded-md w-8" />
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center justify-end gap-1.5">
        <div className="w-8 h-8 rounded-xl bg-slate-100/80" />
        <div className="w-8 h-8 rounded-xl bg-slate-100/80" />
        <div className="w-8 h-8 rounded-xl bg-slate-100/80" />
      </div>
    </td>
  </tr>
);

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
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
        <tbody className="divide-y divide-slate-50/60">
          {[...Array(rows)].map((_, i) => (
            <TableSkeletonRow key={i} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const GridSkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <div
    className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-2xs space-y-4 animate-pulse flex flex-col justify-between"
    style={{ animationDelay: `${index * 75}ms` }}
  >
    <div>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200/80 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-slate-200/80 rounded-md w-32" />
            <div className="h-2.5 bg-slate-100 rounded-md w-16" />
          </div>
        </div>
        <div className="w-6 h-6 rounded-lg bg-slate-100 shrink-0" />
      </div>

      <div className="my-3 border-t border-slate-100" />

      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-200/60" />
          <div className="h-3 bg-slate-200/70 rounded-md w-24" />
        </div>
        <div className="h-8 rounded-xl bg-slate-100/90" />
      </div>
    </div>

    <div className="pt-2">
      <div className="h-9 w-full rounded-xl bg-indigo-50/60" />
    </div>
  </div>
);

const GridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {[...Array(count)].map((_, i) => (
      <GridSkeletonCard key={i} index={i} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────── */

const CustomerHub: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    totalCustomers,
    summary,
    loading,
    loadingMore,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  } = useCustomerStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [accountFilter, setAccountFilter] = useState<"all" | "customers" | "branches">("all");
  const [offices, setOffices] = useState<any[]>([]);

  // Fetch offices
  useEffect(() => {
    getAllOffices()
      .then((res) => setOffices(res.data || []))
      .catch(() => {});
  }, []);
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
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [entryMode, setEntryMode] = useState<"manual" | "bulk">("manual");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInitialMount = useRef(true);

  // Fetch logic: immediate on mount/sort, debounced on text search
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setPage(1);
      fetchCustomers(search, 1, true, false, sortBy, sortOrder);
      return;
    }

    const t = setTimeout(() => {
      setPage(1);
      fetchCustomers(search, 1, true, false, sortBy, sortOrder);
    }, 300);

    return () => clearTimeout(t);
  }, [search, sortBy, sortOrder]);

  const hasMore = customers.length < totalCustomers;

  // Infinite scroll load more handler
  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchCustomers(search, nextPage, true, true, sortBy, sortOrder);
  }, [loading, loadingMore, hasMore, page, search, sortBy, sortOrder, fetchCustomers]);

  // Reliable IntersectionObserver callback ref: attaches whenever element is mounted
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    if (node && hasMore) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          handleLoadMore();
        }
      }, { rootMargin: "250px" });
      observerRef.current.observe(node);
    }
  }, [hasMore, loading, loadingMore, handleLoadMore]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // Click outside menus
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

  // Summary counts
  const totalBalance = summary?.totalOutstanding ?? customers.reduce((s, c) => s + Number(c.balance || 0), 0);
  const dueCount = summary?.dueCount ?? customers.filter(c => Number(c.balance) > 0).length;
  const clientCount = summary?.totalClients ?? totalCustomers;

  return (
    <div className="space-y-6 font-sans animate-in">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <ShieldCheck size={11} /> Secure Ledger
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {loading && !customers.length ? "Loading..." : `${clientCount} Accounts`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Client <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage customer accounts, delivery history & outstanding ledger dues
          </p>
        </div>

        {/* Action Buttons - Perfectly Uniform Height (h-10) and Alignment */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => navigate("/customer/add-material/new")}
            className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Package size={15} />
            <span className="hidden sm:inline">Add Material</span>
            <span className="sm:hidden">Material</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            onClick={() => {
              setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
              setIsModalOpen(true);
            }}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Clients */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Clients</p>
            {loading && !customers.length ? (
              <div className="h-7 w-20 bg-slate-100 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-black text-slate-900 mt-1">{clientCount}</p>
            )}
          </div>
          <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Users size={18} />
          </div>
        </div>

        {/* Due Accounts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Due Accounts</p>
            {loading && !customers.length ? (
              <div className="h-7 w-16 bg-amber-50 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-black text-amber-600 mt-1">{dueCount}</p>
            )}
          </div>
          <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Outstanding</p>
            {loading && !customers.length ? (
              <div className="h-7 w-28 bg-emerald-50 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            )}
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <IndianRupee size={18} />
          </div>
        </div>
      </div>

      {/* ─── DIRECTORY FILTER TABS (CUSTOMERS & BRANCH OFFICES) ─── */}
      <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setAccountFilter("all")}
          className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            accountFilter === "all"
              ? "bg-white text-indigo-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All Accounts ({clientCount + offices.length})
        </button>
        <button
          type="button"
          onClick={() => setAccountFilter("customers")}
          className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            accountFilter === "customers"
              ? "bg-white text-indigo-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Customers ({clientCount})
        </button>
        <button
          type="button"
          onClick={() => setAccountFilter("branches")}
          className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            accountFilter === "branches"
              ? "bg-white text-indigo-700 shadow-2xs font-black"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 size={13} />
          <span>Branches / Offices ({offices.length})</span>
        </button>
      </div>

      {/* ─── SEARCH + CONTROLS ─── */}
      <div className="flex items-center gap-2">
        <div className="relative group flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={15} />
          <input
            type="text"
            placeholder="Search clients by name, phone or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-2xs transition-all"
          />
          {loading && search ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={13} className="animate-spin text-indigo-600" />
            </div>
          ) : search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>

        {/* Sort */}
        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`h-10 px-3.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-2xs ${
              showSortMenu
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-slate-200/80 text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <ListFilter size={15} />
            <span className="hidden sm:inline">Sort</span>
          </button>
          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 py-1.5"
              >
                {[["Name A→Z", "name", "ASC"], ["Name Z→A", "name", "DESC"], ["Balance ↓", "amount", "DESC"]].map(([l, f, o]) => (
                  <button
                    key={l}
                    onClick={() => { setSortBy(f); setSortOrder(o); setShowSortMenu(false); }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      sortBy === f && sortOrder === o ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span>{l}</span>
                    {sortBy === f && sortOrder === o && <div className="size-1.5 rounded-full bg-indigo-600" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* View toggle */}
        <div className="hidden lg:flex bg-white h-10 p-1 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 items-center gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
            title="Table View"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ─── ERROR STATE ─── */}
      {error && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border border-rose-100 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 border border-rose-100">
            <AlertTriangle size={26} />
          </div>
          <h3 className="text-lg font-black text-slate-800">Unable to Load Clients</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md">
            {error}
          </p>
          <button
            onClick={() => fetchCustomers(search, 1, true, false, sortBy, sortOrder)}
            className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      ) : loading && customers.length === 0 ? (
        /* ─── ATTRACTIVE INITIAL SKELETON LOADING ─── */
        viewMode === "table" ? <TableSkeleton rows={8} /> : <GridSkeleton count={8} />
      ) : (
        <>
          {/* ── GRID VIEW ── */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* BRANCH OFFICES CARDS */}
              {accountFilter !== "customers" && (
                <>
                  {offices
                    .filter((o) => {
                      const term = search.toLowerCase();
                      return (
                        !term ||
                        o.office_name.toLowerCase().includes(term) ||
                        (o.location && o.location.toLowerCase().includes(term))
                      );
                    })
                    .map((o) => (
                      <motion.div
                        key={`branch-${o.office_id}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3, transition: { duration: 0.16, ease: "easeOut" } }}
                        onClick={() => navigate(`/branch/details/${o.office_id}`)}
                        className="bg-white rounded-2xl border-2 border-indigo-200 shadow-2xs hover:shadow-md hover:border-indigo-500 transition-all group overflow-hidden cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="p-4 flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                <Building2 size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-black text-slate-800 text-sm truncate max-w-[170px] sm:max-w-[200px] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                  {o.office_name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Branch Office
                                  </span>
                                  {o.location && (
                                    <span className="text-[10px] text-slate-400 truncate">
                                      • {o.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="px-4 pb-2">
                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-semibold">Delivery Log & Stock</span>
                              <span className="font-black text-indigo-700 flex items-center gap-1">
                                <span>Branch Log</span>
                                <ExternalLink size={12} />
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>Branch #{o.office_id}</span>
                          <span className="text-emerald-600 font-black">Live Stock Synced</span>
                        </div>
                      </motion.div>
                    ))}
                </>
              )}

              {accountFilter !== "branches" && (
              <AnimatePresence>
                {customers.map((c, i) => (
                  <motion.div key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.02, 0.2) } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ y: -3, transition: { duration: 0.16, ease: "easeOut" } }}
                    onClick={() => navigate(`/customer/details/${c.id}`)}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all group overflow-hidden cursor-pointer flex flex-col justify-between"
                  >
                    {/* Card top */}
                    <div>
                      <div className="p-4 flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Gradient Avatar */}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarColor(c.name)} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                            {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-slate-800 text-sm truncate max-w-[170px] sm:max-w-[200px] group-hover:text-indigo-600 transition-colors uppercase tracking-tight" title={c.name}>
                              {c.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                {c.category || "Other"}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[9px] font-mono text-slate-400">
                                #{c.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3-dot menu */}
                        <div data-menu className="relative shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === c.id ? null : c.id!); }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer">
                            <MoreVertical size={16} />
                          </button>
                          <AnimatePresence>
                            {activeMenu === c.id && (
                              <motion.div data-menu initial={{ opacity: 0, y: 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .96 }}
                                className="absolute right-0 mt-1 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30 py-1.5">
                                <button onClick={() => { navigate(`/customer/details/${c.id}`); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 cursor-pointer">
                                  <ExternalLink size={12} className="text-slate-400" /> View Ledger
                                </button>
                                <button onClick={() => { setFormData(c); setIsModalOpen(true); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 cursor-pointer">
                                  <Pencil size={12} className="text-slate-400" /> Edit
                                </button>
                                <button onClick={() => { setDeleteId(c.id!); setActiveMenu(null); }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer">
                                  <Trash2 size={12} className="text-rose-400" /> Delete
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="mx-4 border-t border-slate-100" />

                      {/* Details */}
                      <div className="p-4 space-y-2.5">
                        {/* Phone */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.phone_no || "Phone not provided"}</span>
                        </div>

                        {/* Balance Banner */}
                        {Number(c.balance) > 0 ? (
                          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Due Amount</span>
                            <span className="text-sm font-black text-amber-800">
                              ₹{Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                            <span className="text-sm font-black text-slate-600">₹0.00</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="px-4 pb-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/customer/details/${c.id}`); }}
                        className="h-9 w-full bg-indigo-50/80 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group/btn"
                      >
                        <span>Open Ledger</span>
                        <ExternalLink size={12} className="opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              )}

              {/* Streaming loading skeleton cards in Grid View */}
              {loadingMore && (
                <>
                  <GridSkeletonCard index={0} />
                  <GridSkeletonCard index={1} />
                </>
              )}
            </div>
          )}

          {/* ── TABLE VIEW ── */}
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
                    {/* BRANCH OFFICES IN TABLE VIEW */}
                    {accountFilter !== "customers" &&
                      offices
                        .filter((o) => {
                          const term = search.toLowerCase();
                          return (
                            !term ||
                            o.office_name.toLowerCase().includes(term) ||
                            (o.location && o.location.toLowerCase().includes(term))
                          );
                        })
                        .map((o) => (
                          <tr
                            key={`table-office-${o.office_id}`}
                            onClick={() => navigate(`/branch/details/${o.office_id}`)}
                            className="border-b border-indigo-50 bg-indigo-50/20 hover:bg-indigo-50/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                                  <Building2 size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">
                                    {o.office_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold">{o.location || "Office Location"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                              Branch #{o.office_id}
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                Branch Office
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-xs font-black text-emerald-600">Stock Linked</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/branch/details/${o.office_id}`);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <span>Branch Log</span>
                                  <ExternalLink size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                    {accountFilter !== "branches" && (
                    <AnimatePresence>
                      {customers.map((c, i) => (
                        <motion.tr key={c.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i * 0.02, 0.2) } }} exit={{ opacity: 0 }}
                          onClick={() => navigate(`/customer/details/${c.id}`)}
                          className="border-b border-slate-50/60 hover:bg-slate-50/40 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {/* Gradient avatar */}
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(c.name)} flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm`}>
                                {c.name ? c.name.charAt(0).toUpperCase() : "?"}
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
                            <p className={`text-sm font-black tabular-nums ${Number(c.balance) > 0 ? "text-emerald-500" : "text-slate-400"}`}>
                              ₹{Number(c.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            {Number(c.balance) > 0 && <span className="text-[9px] font-black uppercase text-slate-400">Due</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={(e) => { e.stopPropagation(); navigate(`/customer/details/${c.id}`); }} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer" title="View Ledger"><ExternalLink size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setFormData(c); setIsModalOpen(true); }} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer" title="Edit"><Pencil size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id!); }} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer" title="Delete"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    )}

                    {/* Streaming skeleton rows in Table View */}
                    {loadingMore && (
                      <>
                        <TableSkeletonRow index={0} />
                        <TableSkeletonRow index={1} />
                        <TableSkeletonRow index={2} />
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty state (only when search finished and strictly 0 results) */}
          {!loading && customers.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
              <UserCircle2 size={56} className="text-slate-200 mb-3" strokeWidth={1.5} />
              <h2 className="text-lg font-black text-slate-700">No Clients Found</h2>
              <p className="text-slate-400 text-xs mt-1">
                {search ? `No customer records matched "${search}"` : "Try adding your first client to get started."}
              </p>
              {search && (
                <button onClick={() => setSearch("")} className="mt-5 px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs shadow-md shadow-indigo-600/20 cursor-pointer">
                  Clear Search Filter
                </button>
              )}
            </motion.div>
          )}

          {/* ─── INFINITE SCROLL SENTINEL & LOAD MORE CONTROL ─── */}
          {hasMore && customers.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              {/* Invisible sentinel observed by IntersectionObserver for auto-scroll */}
              <div ref={sentinelCallbackRef} className="h-4 w-full" />

              {/* Explicit attractive Load More button */}
              <button
                onClick={() => handleLoadMore()}
                disabled={loadingMore || loading}
                className="px-6 py-2.5 bg-white hover:bg-indigo-50/70 text-indigo-700 hover:text-indigo-800 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 group"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-indigo-600" />
                    <span>Loading more clients...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Clients</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100/70 text-[10px] font-black text-indigo-700 group-hover:bg-indigo-200/80 transition-colors">
                      {Math.max(0, totalCustomers - customers.length)} remaining
                    </span>
                    <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* All loaded indicator */}
          {!hasMore && customers.length > 0 && (
            <div className="text-center py-6">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                ✓ All {totalCustomers} clients loaded
              </p>
            </div>
          )}
        </>
      )}

      {/* ─── ADD/EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg overflow-y-auto max-h-[96vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-slate-900">{formData.id ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors cursor-pointer"><X size={17} /></button>
            </div>
            <div className="px-6 pt-4">
              <div className="flex p-1 bg-slate-100 rounded-xl relative">
                <button onClick={() => setEntryMode("manual")} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest z-10 transition-colors cursor-pointer ${entryMode === "manual" ? "text-indigo-600" : "text-slate-400"}`}>Manual</button>
                <button onClick={() => setEntryMode("bulk")} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest z-10 transition-colors cursor-pointer ${entryMode === "bulk" ? "text-indigo-600" : "text-slate-400"}`}>Bulk Import</button>
                <motion.div className="absolute inset-1 bg-white rounded-lg shadow-sm" animate={{ x: entryMode === "manual" ? "0%" : "100%" }} style={{ width: "calc(50% - 4px)" }} />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {entryMode === "manual" ? (
                <motion.form key="m" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                  <div><label className={lc}>Full Name *</label><input required type="text" className={`${ic} mt-1`} placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Phone</label><input maxLength={10} className={`${ic} mt-1`} placeholder="10-digit" value={formData.phone_no} onChange={e => setFormData({ ...formData, phone_no: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></div>
                    <div><label className={lc}>Category</label><select className={`${ic} mt-1 appearance-none`} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}><option value="engineer">Engineer</option><option value="shop">Shop</option><option value="other">Other</option></select></div>
                  </div>
                  <div><label className={lc}>Email</label><input type="email" className={`${ic} mt-1`} placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                  {!formData.id && <div><label className={lc}>Initial Balance</label><input type="number" step="0.01" className={`${ic} mt-1`} placeholder="0.00" value={formData.balance === 0 ? '' : formData.balance} onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })} /></div>}
                  <div><label className={lc}>Address</label><textarea rows={2} className={`${ic} mt-1 resize-none`} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="h-10 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs transition-colors cursor-pointer">Cancel</button>
                    <button type="submit" disabled={submitting} className="h-10 px-5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer">
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}{formData.id ? 'Update Client' : 'Save Client'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div key="b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-4">
                  <div onClick={() => fileInputRef.current?.click()} className="group w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                    <div className="p-4 bg-white rounded-2xl shadow-xs border border-slate-100 text-slate-500 group-hover:scale-105 transition-transform">
                      {isParsing ? <Loader2 size={24} className="animate-spin text-indigo-600" /> : bulkFile ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Upload size={24} />}
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-700 truncate px-4 text-center w-full">{isParsing ? "Parsing PDF..." : bulkFile ? bulkFile.name : "Upload Consolidated PDF"}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">PDF format only</p>
                    <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                  </div>
                  {parsedCustomers.length > 0 && (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Found {parsedCustomers.length} clients</p>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 text-xs">
                        <table className="w-full"><thead className="sticky top-0 bg-slate-100"><tr><th className="px-3 py-2 text-left font-black text-slate-500 text-[10px] uppercase">Name</th><th className="px-3 py-2 font-black text-slate-500 text-[10px] uppercase">Phone</th></tr></thead>
                          <tbody>{parsedCustomers.slice(0, 100).map((c, i) => <tr key={i} className="border-t border-slate-100"><td className="px-3 py-2 font-bold text-slate-700 truncate max-w-[150px]">{c.name}</td><td className="px-3 py-2 text-slate-500">{c.phone_no}</td></tr>)}</tbody>
                        </table>
                      </div>
                      <button onClick={handleBulkSubmit} disabled={submitting} className="w-full h-10 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-60 cursor-pointer">
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
