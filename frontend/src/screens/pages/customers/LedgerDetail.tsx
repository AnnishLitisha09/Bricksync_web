import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Package, TrendingUp, 
  Download, Receipt, Loader2, Truck, Plus, Wallet, 
  PhoneCall, X, BellRing, User, HardHat 
} from "lucide-react";
import { getCustomerById } from "../../../store/customers/customerService";
import AddMaterialModal from "./AddMaterialModal";

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  
  const [callDetails, setCallDetails] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    remark: "",
    nextDate: "" 
  });

  useEffect(() => {
    if (id) {
      getCustomerById(id).then(data => {
        setCustomer(data);
        setLoading(false);
      });
    }
  }, [id]);

  const totals = useMemo(() => {
    if (!customer) return { debit: 0, credit: 0, balance: 0 };
    const debit = customer.ledger.reduce((sum: number, tx: any) => sum + (tx.totalDebit || 0), 0);
    const credit = customer.ledger.reduce((sum: number, tx: any) => sum + (tx.totalCredit || 0), 0);
    return { debit, credit, balance: credit - debit };
  }, [customer]);

  const handleCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCallModalOpen(false);
    setCallDetails({ date: new Date().toISOString().split('T')[0], remark: "", nextDate: "" });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FBFDFF]">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  if (!customer) return <div className="p-12 text-center font-bold text-slate-400">Customer not found.</div>;

  return (
    <div className="p-4 sm:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 animate-in fade-in duration-500 relative">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Hub
          </button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCallModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
              <PhoneCall size={18} /> Call Log
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={18} /> Export
            </button>
            <button 
              onClick={() => setIsMaterialModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={18} /> Add Material
            </button>
          </div>
        </div>

        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {customer.name} <span className="text-indigo-600">Ledger</span>
            </h1>
            <div className="flex items-center gap-2 mt-4 text-slate-500 font-medium">
              <Receipt size={18} />
              <span className="text-lg">Account ID: #{customer._id}</span>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Outstanding Balance</p>
              <h2 className="text-3xl font-black">₹{totals.balance.toLocaleString()}</h2>
            </div>
            <Wallet className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" size={100} />
            <div className="mt-4 flex gap-4 relative z-10">
               <div className="text-[10px]">
                  <p className="text-slate-400 font-bold uppercase">Total Billed</p>
                  <p className="font-bold">₹{totals.credit.toLocaleString()}</p>
               </div>
               <div className="text-[10px]">
                  <p className="text-slate-400 font-bold uppercase">Total Paid</p>
                  <p className="font-bold text-emerald-400">₹{totals.debit.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Ledger Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Ref</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Particulars & Logistics</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (Paid)</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (Dispatch)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customer.ledger.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-indigo-50/20 transition-colors align-top">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold flex items-center gap-2 whitespace-nowrap">
                          <Calendar size={14} className="text-slate-400" /> {tx.date}
                        </span>
                        <span className="text-indigo-600 text-[11px] font-black mt-1 uppercase tracking-widest">Ref-{tx.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-6">
                        {tx.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex flex-col border-l-2 border-slate-100 pl-4 gap-2">
                            <span className="text-slate-700 font-bold text-sm flex items-center gap-2">
                              {tx.type === "Payment" ? <TrendingUp size={14} className="text-emerald-500" /> : <Package size={14} className="text-indigo-500" />}
                              {item.particulars}
                            </span>
                            
                            {/* Logistics Badges */}
                            <div className="flex flex-wrap gap-2 mt-1">
                              {item.vehicleNumber && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                                  <Truck size={12} /> {item.vehicleNumber}
                                </div>
                              )}
                              {item.driverName && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                                  <User size={12} /> {item.driverName}
                                </div>
                              )}
                              {/* Render Multiple Loaders */}
                              {item.loadingNames?.map((loader: string, lIdx: number) => (
                                <div key={lIdx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                                  <HardHat size={12} /> {loader}
                                </div>
                              ))}
                            </div>
                            <span className="text-slate-400 text-xs font-semibold">₹{item.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {tx.totalDebit > 0 && (
                        <div className="inline-flex px-4 py-2 bg-emerald-500 rounded-xl text-white font-black text-sm">
                          ₹{tx.totalDebit.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {tx.totalCredit > 0 && (
                        <div className="inline-flex px-4 py-2 bg-slate-900 rounded-xl text-white font-black text-sm">
                          ₹{tx.totalCredit.toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CALL LOG MODAL */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCallModalOpen(false)} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Log Call</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Communication Remark</p>
              </div>
              <button onClick={() => setIsCallModalOpen(false)} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCallSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Call Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="date" 
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none"
                      value={callDetails.date}
                      onChange={(e) => setCallDetails({...callDetails, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-400 ml-1">Next Follow-up</label>
                  <div className="relative">
                    <BellRing className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                    <input 
                      type="date" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-indigo-50 bg-indigo-50/30 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none"
                      value={callDetails.nextDate}
                      onChange={(e) => setCallDetails({...callDetails, nextDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Remark / Discussion</label>
                <textarea 
                  placeholder="Summarize discussion..."
                  required
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none resize-none"
                  value={callDetails.remark}
                  onChange={(e) => setCallDetails({...callDetails, remark: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <PhoneCall size={18} />
                Save Call Entry
              </button>
            </form>
          </div>
        </div>
      )}

      <AddMaterialModal 
        isOpen={isMaterialModalOpen} 
        onClose={() => setIsMaterialModalOpen(false)} 
        customerId={id || ""}
      />

    </div>
  );
};

export default CustomerDetails;