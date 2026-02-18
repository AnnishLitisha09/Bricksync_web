import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, ShieldCheck, Users, User, CreditCard, 
  Mail, Phone, ExternalLink, Loader2 
} from "lucide-react";
import { getAllCustomers } from "../../../store/customers/customerService";

const CustomerHub: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 font-sans">
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
              <div key={customer._id} className="bg-white rounded-[2.5rem] border border-slate-200 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 group overflow-hidden">
                <div className="p-8 pb-4 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center relative">
                    <User size={32} className="text-slate-300" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{customer.name}</h3>
                    <p className="text-indigo-500 font-bold text-xs uppercase flex items-center gap-1.5"><CreditCard size={12} /> Commercial</p>
                  </div>
                </div>

                <div className="px-8 space-y-3 py-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600">
                    <Mail size={16} className="text-slate-400" /> {customer.email}
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-semibold text-slate-600">
                    <Phone size={16} className="text-slate-400" /> {customer.phoneNumber}
                  </div>
                </div>

                <div className="mt-auto p-8 pt-4 flex items-center justify-between border-t border-slate-50">
                  <span className="text-sm font-black text-slate-900">{customer.ledger?.length || 0} Records</span>
                  <button 
                    onClick={() => navigate(`/customer/details/${customer._id}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-indigo-600 transition-all shadow-lg"
                  >
                    View Ledger <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomerHub;