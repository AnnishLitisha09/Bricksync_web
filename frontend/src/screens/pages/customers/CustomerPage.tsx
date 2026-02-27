import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShieldCheck, Users, User, CreditCard,
  Mail, Phone, ExternalLink, Loader2, Plus, X, Pencil, Trash2,
  AlertTriangle
} from "lucide-react";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../../api/customer";
import type { CustomerData } from "../../../api/customer";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CustomerHub: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    email: "",
    phone_no: "",
    address: "",
    balance: 0,
    category: "other",
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const loadData = async (pageNum: number, searchStr: string, isAppend: boolean = false) => {
    try {
      if (!isAppend) setLoading(true);
      const res = await fetchCustomers(searchStr, pageNum, 6);

      if (isAppend) {
        setCustomers(prev => [...prev, ...res.data]);
      } else {
        setCustomers(res.data);
      }

      setTotalCustomers(res.pagination.total);
      setHasMore(res.pagination.page < res.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadData(1, search, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, search, true);
    }
  }, [loading, hasMore, search, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loading]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");

    // Phone validation: must be exactly 10 digits if provided
    if (formData.phone_no && !/^\d{10}$/.test(formData.phone_no)) {
      return toast.error("Phone number must be exactly 10 digits");
    }

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
      setPage(1);
      loadData(1, search, false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error saving client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteId) return;
    try {
      setSubmitting(true);
      await deleteCustomer(deleteId);
      toast.success("Client deleted successfully!");
      setPage(1);
      loadData(1, search, false);
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-6 sm:space-y-8 font-sans relative">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest border border-indigo-100">
            <ShieldCheck size={14} /> Secure Ledger System
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Client <span className="text-indigo-600">Hub</span>
          </h1>
        </div>

        <div className="bg-white p-2 rounded-3xl border border-slate-200 flex flex-row items-center gap-3 sm:gap-4 pr-4 sm:pr-6 shadow-sm w-full xl:w-auto overflow-x-auto hide-scrollbar">
          <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl text-white shrink-0">
            <Users size={20} className="sm:hidden" />
            <Users size={24} className="hidden sm:block" />
          </div>
          <div className="flex-1 sm:flex-none">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Active Accounts</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
              {loading && customers.length === 0 ? "..." : totalCustomers}
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: "", email: "", phone_no: "", address: "", balance: 0, category: "other" });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm sm:text-base shrink-0 ml-auto"
          >
            <Plus size={18} className="sm:hidden" />
            <Plus size={20} className="hidden sm:block" />
            <span className="hidden sm:inline">Create Client</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative group max-w-2xl w-full">
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors w-5 h-5 sm:w-[22px] sm:h-[22px]" />
        <input
          type="text"
          placeholder="Search by client name or phone..."
          className="w-full pl-12 pr-6 py-4 sm:pl-16 sm:pr-8 sm:py-6 rounded-[2rem] sm:rounded-3xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 text-base sm:text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content Area */}
      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing Accounts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {customers.map((customer, index) => (
            <div
              key={customer.id}
              className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 group overflow-hidden animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${(index % 6) * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="p-8 pb-4 flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center relative">
                  <User size={32} className="text-slate-300" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white bg-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{customer.name}</h3>
                  <p className="text-indigo-500 font-bold text-xs uppercase flex items-center gap-1.5"><CreditCard size={12} /> {customer.category}</p>
                </div>
              </div>

              <div className="px-5 sm:px-8 space-y-3 py-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm font-semibold text-slate-600 break-all sm:break-normal">
                  <Mail size={16} className="text-slate-400 shrink-0" /> {customer.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm font-semibold text-slate-600">
                  <Phone size={16} className="text-slate-400 shrink-0" /> {customer.phone_no || 'No phone provided'}
                </div>
              </div>

              <div className="mt-auto p-5 sm:p-8 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-slate-50">
                <span className="text-sm font-black text-slate-900">Balance: ₹{Number(customer.balance).toFixed(2)}</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setFormData(customer);
                      setIsModalOpen(true);
                    }}
                    className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm flex-1 sm:flex-none flex justify-center items-center"
                    title="Edit Client"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteId(customer.id!)}
                    className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm flex-1 sm:flex-none flex justify-center items-center"
                    title="Delete Client"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/customer/details/${customer.id}`);
                    }}
                    className="flex-2 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3 bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg w-full sm:w-auto"
                  >
                    <span className="hidden xs:inline">View</span> Ledger <ExternalLink size={14} className="hidden xs:block" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      <div ref={observerTarget} className="h-10 w-full" />

      {/* Loading state for scroll */}
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

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-xl">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{formData.id ? 'Edit Client' : 'Create Client'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-6 sm:p-8 space-y-4 sm:space-y-5">

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input
                    maxLength={10}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                    placeholder="e.g. 9876543210"
                    value={formData.phone_no}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, phone_no: val });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium appearance-none"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  >
                    <option value="engineer">Engineer</option>
                    <option value="shop">Shop</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {!formData.id && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                    placeholder="0.00"
                    value={formData.balance === 0 ? '' : formData.balance}
                    onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium resize-none"
                  placeholder="Enter full address..."
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white shadow-[0_-20px_20px_-15px_rgba(255,255,255,1)] pb-4 sm:pb-0 z-10 w-full mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 sm:bg-transparent hover:bg-slate-200 sm:hover:bg-slate-100 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  {formData.id ? 'Update Client' : 'Save Client'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setDeleteId(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 animate-pulse">
                  <AlertTriangle size={40} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Remove Client?</h3>
                  <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                    Are you sure you want to remove this client? This will move their account to the <span className="text-red-500">archived records</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full pt-4">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-slate-500 bg-slate-50 sm:bg-transparent sm:text-slate-400 hover:bg-slate-100 sm:hover:bg-slate-50 transition-all border border-slate-200 sm:border-slate-100 text-xs uppercase tracking-widest order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomer}
                    disabled={submitting}
                    className="py-3 sm:py-4 bg-red-500 text-white rounded-xl sm:rounded-2xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-200 text-xs uppercase tracking-widest flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} /> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerHub;