import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ShieldCheck, Users, User, CreditCard,
  Mail, Phone, ExternalLink, Loader2, Plus, X, Pencil, Trash2
} from "lucide-react";
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from "../../../api/customer";
import type { CustomerData } from "../../../api/customer";
import { toast } from "react-hot-toast";

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

  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCustomers();
      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to fetch customers", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");

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
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error saving client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await deleteCustomer(id);
      toast.success("Client deleted successfully!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete client");
    }
  };

  return (
    <div className="p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 font-sans relative">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-widest border border-indigo-100">
            <ShieldCheck size={14} /> Secure Ledger System
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Client <span className="text-indigo-600">Hub</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 flex items-center gap-4 pr-6 shadow-sm">
            <div className="bg-slate-900 p-4 rounded-2xl text-white">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Accounts</p>
              <p className="text-2xl font-black text-slate-900 leading-none">
                {loading ? "..." : customers.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            <Plus size={20} /> Create Client
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={22} />
        <input
          type="text"
          placeholder="Search by client name..."
          className="w-full pl-16 pr-8 py-6 rounded-3xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 text-lg"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Synchronizing Accounts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
          {customers
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
            .map((customer) => (
              <div key={customer.id} className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 group overflow-hidden">
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

                <div className="px-8 space-y-3 py-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600">
                    <Mail size={16} className="text-slate-400" /> {customer.email || 'No email provided'}
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600">
                    <Phone size={16} className="text-slate-400" /> {customer.phone_no || 'No phone provided'}
                  </div>
                </div>

                <div className="mt-auto p-8 pt-4 flex items-center justify-between border-t border-slate-50">
                  <span className="text-sm font-black text-slate-900">Balance: ₹{Number(customer.balance).toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFormData(customer);
                        setIsModalOpen(true);
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                      title="Edit Client"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this client?")) {
                          handleDeleteCustomer(customer.id!);
                        }
                      }}
                      className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                      title="Delete Client"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customer/details/${customer.id}`);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg"
                    >
                      View Ledger <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          {customers.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500 font-medium">
              No clients found in the system.
            </div>
          )}
        </div>
      )}

      {/* Create Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900">Create New Client</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-8 space-y-5">

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

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium"
                    placeholder="e.g. 9876543210"
                    value={formData.phone_no}
                    onChange={e => setFormData({ ...formData, phone_no: e.target.value })}
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

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  Save Client
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerHub;