import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShieldCheck, Users,
  Phone, ExternalLink, Loader2, Plus, X, Pencil, Trash2,
  AlertTriangle, Upload, CheckCircle2, ListFilter, Download
} from "lucide-react";
import type { CustomerData } from "../../../store/customers/useCustomerStore";
import { useCustomerStore } from "../../../store/customers/useCustomerStore";
import { bulkCreateCustomers } from "../../../api/customer";
import { parseCustomerPdf, type ParsedCustomer } from "../../../utils/parseCustomerPdf";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ExportCustomerModal from "./ExportCustomerModal";

const CustomerHub: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers, totalCustomers, loading,
    fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  } = useCustomerStore();

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({
    name: "", email: "", phone_no: "", address: "", balance: 0, category: "other",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("ASC");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [entryMode, setEntryMode] = useState<"manual" | "bulk">("manual");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial & search-triggered load
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchCustomers(search, 1, true, false, sortBy, sortOrder);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sortBy, sortOrder]);

  // Click outside listener for sort menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync hasMore from store pagination
  useEffect(() => {
    setHasMore(customers.length < totalCustomers);
  }, [customers, totalCustomers]);

  const handleLoadMore = useCallback(async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchCustomers(search, nextPage, false, true, sortBy, sortOrder);
    }
  }, [loading, hasMore, search, page, fetchCustomers, sortBy, sortOrder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) handleLoadMore();
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loading]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    if (formData.phone_no && !/^\d{10}$/.test(formData.phone_no))
      return toast.error("Phone number must be exactly 10 digits");

    setSubmitting(true);
    try {
      if (formData.id) {
        await updateCustomer(formData.id, formData);
        toast.success("Client updated successfully!");
      } else {
        await createCustomer(formData);
        toast.success("Client created successfully!");
      }
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
    } catch (error: any) {
      toast.error(error.message || "Error saving client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file);
    setParsedCustomers([]);
    if (!file) return;
    setIsParsing(true);
    try {
      const result = await parseCustomerPdf(file);
      setParsedCustomers(result);
      toast.success(`Parsed ${result.length} clients from PDF`);
    } catch (err: any) {
      toast.error("Failed to parse PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedCustomers.length === 0) return;
    setSubmitting(true);
    try {
      await bulkCreateCustomers(parsedCustomers as any);
      toast.success(`Imported ${parsedCustomers.length} clients successfully!`);
      setIsModalOpen(false);
      fetchCustomers("", 1, true); // Refresh list
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed");
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wider";
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium";

  const handleDeleteCustomer = async () => {
    if (!deleteId) return;
    try {
      setSubmitting(true);
      await deleteCustomer(deleteId);
      toast.success("Client deleted successfully!");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to delete client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-6 sm:space-y-8 font-sans relative">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest border border-indigo-100">
            <ShieldCheck size={14} /> Secure Ledger System
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Client <span className="text-indigo-600">Hub</span>
          </h1>
        </div>

        <div className="bg-white p-2 rounded-3xl border border-slate-200 flex flex-row items-center gap-3 sm:gap-6 pr-4 shadow-sm w-full lg:w-auto">
          <div className="bg-slate-900 p-3 sm:p-5 rounded-2xl text-white shrink-0">
            <Users size={20} className="sm:hidden" />
            <Users size={28} className="hidden sm:block" />
          </div>
          <div className="flex-1 sm:flex-none">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase leading-tight">Active Accounts</p>
            <p className="text-xl sm:text-3xl font-black text-slate-900 leading-none mt-0.5">
              {loading && customers.length === 0 ? "..." : totalCustomers}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="bg-slate-100 text-slate-600 px-4 py-3 sm:px-6 sm:py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-900 hover:text-white transition shadow-sm text-sm sm:text-base shrink-0"
              title="Export All Customers"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => {
                setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-5 py-3 sm:px-8 sm:py-5 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm sm:text-base shrink-0"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Client</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar & Filters */}
      <div className="flex items-center gap-2 sm:gap-4 max-w-2xl w-full">
        <div className="relative group flex-1">
          <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by client name or phone..."
            className="w-full pl-11 pr-4 py-3 sm:pl-16 sm:pr-8 sm:py-4.5 rounded-2xl sm:rounded-[2rem] border-2 border-slate-100 bg-white shadow-lg shadow-slate-200/20 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm sm:text-lg placeholder:text-slate-300 uppercase italic"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sort Filter Dropdown */}
        <div className="relative shrink-0" ref={sortMenuRef}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`p-3 sm:p-4.5 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 shadow-lg ${showSortMenu ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600 shadow-slate-200/20'
              }`}
          >
            <ListFilter size={20} />
            <span className="font-black text-[10px] uppercase tracking-widest hidden sm:block">Sort</span>
          </button>

          <AnimatePresence>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-4 w-64 bg-white rounded-[2rem] border border-slate-100 shadow-2xl z-50 overflow-hidden py-4"
              >
                <div className="px-6 py-2 mb-2 border-b border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorting Options</p>
                </div>
                <button
                  onClick={() => { setSortBy("name"); setSortOrder("ASC"); setShowSortMenu(false); }}
                  className={`w-full px-6 py-4 text-left text-sm font-bold flex items-center justify-between transition-colors ${sortBy === 'name' && sortOrder === 'ASC' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Name (A to Z)
                  {sortBy === 'name' && sortOrder === 'ASC' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
                <button
                  onClick={() => { setSortBy("name"); setSortOrder("DESC"); setShowSortMenu(false); }}
                  className={`w-full px-6 py-4 text-left text-sm font-bold flex items-center justify-between transition-colors ${sortBy === 'name' && sortOrder === 'DESC' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Name (Z to A)
                  {sortBy === 'name' && sortOrder === 'DESC' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
                <button
                  onClick={() => { setSortBy("amount"); setSortOrder("DESC"); setShowSortMenu(false); }}
                  className={`w-full px-6 py-4 text-left text-sm font-bold flex items-center justify-between transition-colors ${sortBy === 'amount' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Balance (High to Low)
                  {sortBy === 'amount' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content Area - Table Layout */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Customer Name</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Phone Number</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Balance</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {customers.map((customer, index) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 12) * 0.04 }}
                  className="hover:bg-gradient-to-r hover:from-white hover:to-indigo-50/20 transition-all group relative border-l-4 border-l-transparent hover:border-l-indigo-600"
                >
                  <td className="px-10 py-6">
                    <div>
                      <p className="text-base font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">{customer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        REF ID: BS-{customer.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4 text-slate-600 font-bold text-sm">
                      <div className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">
                        <Phone size={14} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <span className="tracking-tight">{customer.phone_no || "—"}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="inline-flex flex-col items-end">
                      <p className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">
                        ₹{Number(customer.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${Number(customer.balance) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {Number(customer.balance) > 0 ? 'Outstanding' : 'Cleared'}
                      </p>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => { setFormData(customer); setIsModalOpen(true); }}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm"
                        title="Edit Profile"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(customer.id!)}
                        className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95 shadow-sm"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/customer/details/${customer.id}`)}
                        className="flex items-center gap-2.5 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all transform hover:-translate-y-1 active:scale-95 shadow-md shadow-slate-200"
                      >
                        Ledger <ExternalLink size={12} className="opacity-50" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12 bg-slate-50/30">
            <Loader2 className="animate-spin text-indigo-600 mr-3" size={24} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Records...</span>
          </div>
        )}

        {!loading && customers.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="text-slate-200" size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Customers Found</h3>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Adjust your search or add a new client</p>
          </div>
        )}
      </div>

      {/* Styles for horizontal scroll */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

      {/* Infinite Scroll Sentinel */}
      <div ref={observerTarget} className="h-10 w-full" />

      {loading && customers.length > 0 && (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      )}

      {customers.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
          <div className="bg-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
            <Users size={40} />
          </div>
          <p className="text-slate-500 font-bold text-lg">No clients found in the system.</p>
        </div>
      )}

      {/* Create / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{formData.id ? 'Edit Client' : 'Create Client'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            {/* TOGGLE MODE */}
            <div className="px-6 sm:px-8 mt-6">
              <div className="flex p-1.5 bg-slate-100 rounded-3xl relative">
                <button
                  type="button"
                  onClick={() => setEntryMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "manual" ? "text-indigo-600" : "text-slate-400"}`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("bulk")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "bulk" ? "text-indigo-600" : "text-slate-400"}`}
                >
                  Bulk Import
                </button>
                <motion.div
                  className="absolute inset-1.5 bg-white rounded-2xl shadow-sm"
                  animate={{ x: entryMode === "manual" ? "0%" : "100%" }}
                  style={{ width: "calc(50% - 12px)" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {entryMode === "manual" ? (
                <motion.form
                  key="manual"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreateCustomer}
                  className="p-6 sm:p-8 space-y-4 sm:space-y-5"
                >
                  <div className="space-y-1.5">
                    <label className={labelClass}>Full Name *</label>
                    <input required type="text" className={inputClass} placeholder="e.g. John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Phone</label>
                      <input maxLength={10} className={inputClass} placeholder="e.g. 9876543210" value={formData.phone_no} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone_no: val });
                      }} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Category</label>
                      <select className={`${inputClass} appearance-none`} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                        <option value="engineer">Engineer</option>
                        <option value="shop">Shop</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Email Address</label>
                    <input type="email" className={inputClass} placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  {!formData.id && (
                    <div className="space-y-1.5">
                      <label className={labelClass}>Initial Balance</label>
                      <input type="number" step="0.01" className={inputClass} placeholder="0.00" value={formData.balance === 0 ? '' : formData.balance} onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })} />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className={labelClass}>Address</label>
                    <textarea rows={2} className={`${inputClass} resize-none`} placeholder="Enter full address..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>

                  <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white pb-4 sm:pb-0 z-10 w-full mt-2 sm:mt-0">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 transition text-center">Cancel</button>
                    <button type="submit" disabled={submitting} className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                      {formData.id ? 'Update Client' : 'Save Client'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="bulk"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 sm:p-8 space-y-6"
                >
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group w-full py-12 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-50/30 transition-all"
                  >
                    <div className="p-6 bg-white rounded-3xl shadow-xl text-indigo-600 group-hover:scale-110 transition-transform">
                      {isParsing ? <Loader2 size={32} className="animate-spin" /> : bulkFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                    </div>
                    <p className="mt-4 text-sm font-black text-slate-700 uppercase tracking-tighter px-6 text-center truncate w-full">
                      {isParsing ? "Analyzing PDF..." : bulkFile ? bulkFile.name : "Upload Consolidate PDF"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Consolidated Outstanding format supported</p>
                    <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                  </div>

                  {parsedCustomers.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Found {parsedCustomers.length} Clients</h4>
                        <div className="h-px flex-1 bg-slate-100 mx-4" />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto rounded-3xl border border-slate-100 bg-slate-50">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-slate-100 z-10">
                            <tr>
                              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Name</th>
                              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Phone</th>
                              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Email</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedCustomers.slice(0, 100).map((c, i) => (
                              <tr key={i} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-800">{c.name}</td>
                                <td className="px-4 py-3 text-slate-500 font-medium">{c.phone_no}</td>
                                <td className="px-4 py-3 text-indigo-500 font-bold">{c.email}</td>
                              </tr>
                            ))}
                            {parsedCustomers.length > 100 && (
                              <tr>
                                <td colSpan={3} className="px-4 py-3 text-center text-slate-400 font-bold italic">
                                  + {parsedCustomers.length - 100} more clients...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={handleBulkSubmit}
                        disabled={submitting}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                      >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        {submitting ? "Importing Clients..." : `Import ${parsedCustomers.length} Clients`}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setDeleteId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 animate-pulse"><AlertTriangle size={40} /></div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Remove Client?</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">Are you sure you want to remove this client? This will move their account to the <span className="text-red-500">archived records</span>.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full pt-4">
                  <button onClick={() => setDeleteId(null)} className="py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200 text-xs uppercase tracking-widest order-2 sm:order-1">Cancel</button>
                  <button onClick={handleDeleteCustomer} disabled={submitting} className="py-3 sm:py-4 bg-red-500 text-white rounded-xl sm:rounded-2xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-200 text-xs uppercase tracking-widest flex items-center justify-center gap-2 order-1 sm:order-2">
                    {submitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 size={14} /> Delete</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ExportCustomerModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default CustomerHub;