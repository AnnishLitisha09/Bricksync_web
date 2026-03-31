import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Package, TrendingUp,
  Receipt, Loader2, Truck, Plus, Wallet,
  PhoneCall, X, BellRing, User, HardHat, Building2,
  Pencil, Trash2, CreditCard, Navigation,
  ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { fetchCustomerById, deleteCustomerStatement } from "../../../api/customer";
import { createCallLog } from "../../../api/callLog";
import { deleteOrder } from "../../../api/order";
import RecordPaymentModal from "./RecordPaymentModal";
import ExportLedgerModal from "./ExportLedgerModal";
import { toast } from "react-hot-toast";

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState<any>(null);

  const [callDetails, setCallDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    remark: "",
    nextDate: ""
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await fetchCustomerById(id);
      setCustomer(data.data);
    } catch (error) {
      console.error("Failed to fetch customer", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteEntry = async (type: string, entryId: string | number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) return;

    try {
      if (type === "Dispatch") {
        const numericId = typeof entryId === 'string' ? Number(entryId.replace('ORD-', '')) : entryId;
        await deleteOrder(numericId);
      } else {
        const numericId = typeof entryId === 'string' ? Number(entryId.replace('STMT-', '')) : entryId;
        await deleteCustomerStatement(numericId);
      }
      toast.success(`${type} deleted successfully`);
      loadData();
    } catch (error) {
      toast.error(`Failed to delete ${type.toLowerCase()}`);
    }
  };

  const totals = useMemo(() => {
    if (!customer) return { debit: 0, credit: 0, balance: 0 };
    // Debit = Payments (CustomerStatement)
    const debit = (customer.statements || []).reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    // Credit = Orders (Sum of item totals + TransportCharge)
    const credit = (customer.orders || []).reduce((sum: number, tx: any) => {
      const itemsVal = (tx.items || []).reduce((iSum: number, item: any) => iSum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
      return sum + itemsVal + Number(tx.transport_charge || 0);
    }, 0);
    return { debit, credit, balance: credit - debit };
  }, [customer]);

  const handleCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await createCallLog({
        cus_id: Number(id),
        date: callDetails.date,
        next_call_date: callDetails.nextDate,
        description: callDetails.remark
      });
      toast.success("Call log saved");
      setIsCallModalOpen(false);
      setCallDetails({ date: new Date().toISOString().split('T')[0], remark: "", nextDate: "" });
      loadData();
    } catch (error) {
      toast.error("Failed to save call log");
    }
  };

  const ledgerEntries = useMemo(() => {
    if (!customer) return [];
    const entries: any[] = [];

    (customer.orders || []).forEach((o: any) => {
      const itemsValue = (o.items || []).reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
      const transportCharge = Number(o.transport_charge || 0);
      const totalAmount = itemsValue + transportCharge;

      const itemsSummary = (o.items || []).map((item: any) => item.product).join(", ");
      const offices = Array.from(new Set((o.items || []).map((item: any) => item.office?.office_name).filter(Boolean))).join(", ");

      entries.push({
        id: `ORD-${o.order_id}`,
        date: o.date ? (o.date.includes('T') ? o.date.split('T')[0] : o.date) : "",
        type: "Dispatch",
        particulars: `${itemsSummary}${transportCharge > 0 ? ` + Transport (₹${transportCharge})` : ""}`,
        amount: totalAmount,
        credit: totalAmount,
        debit: 0,
        office: offices,
        items: (o.items || []).map((item: any) => ({
          product: item.product,
          office: item.office?.office_name,
          qty: item.quantity,
          rate: item.price,
          vehicle: item.vehicle?.vehicleNumber,
          staff: item.orderEmployees?.map((oe: any) => ({
            name: oe.employee?.name || oe.employee?.employee_name,
            role: oe.role
          }))
        })),
        raw: o
      });
    });

    (customer.statements || []).forEach((s: any) => {
      entries.push({
        id: `STMT-${s.id}`,
        date: s.date || s.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: "Payment",
        particulars: `Payment via ${s.bank_type}`,
        amount: s.amount,
        credit: 0,
        debit: s.amount,
        raw: s
      });
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return ledgerEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [ledgerEntries, currentPage]);

  const totalPages = Math.ceil(ledgerEntries.length / itemsPerPage);

  // Handle Pagination Centering
  useEffect(() => {
    const activeBtn = document.getElementById(`ledger-page-btn-${currentPage}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentPage, totalPages]);

  if (!customer && !loading) return <div className="p-12 text-center font-bold text-slate-400">Customer not found.</div>;

  return (
    <div className="p-4 sm:p-8 lg:p-12 min-h-screen bg-[#FBFDFF] space-y-8 animate-in fade-in duration-500 relative">
      {loading ? (
        <div className="h-screen flex items-center justify-center bg-[#FBFDFF] absolute inset-0 z-50">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : (
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCallModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-4xl font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
              >
                <PhoneCall size={18} /> Call Log
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditPaymentData(null);
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm"
              >
                <CreditCard size={18} /> Record Payment
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExportModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
              >
                <Download size={18} /> Export Ledger
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/customer/add-material/${id}`, { state: { customerName: customer?.name } });
                }}
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
                <span className="text-lg">Account ID: #{customer.id}</span>
              </div>
            </div>

            <div className="bg-slate-900 rounded-4xl p-6 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
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
          <div className="bg-white rounded-4xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Ref</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Particulars & Logistics</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (Paid)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (Dispatch)</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedEntries.map((tx: any) => {
                    return (
                      <tr key={tx.id} className="hover:bg-indigo-50/20 transition-colors align-top group">
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold flex items-center gap-2 whitespace-nowrap">
                              <Calendar size={14} className="text-slate-400" /> {tx.date}
                            </span>
                            <span className="text-indigo-600 text-[11px] font-black mt-1 uppercase tracking-widest">{tx.id}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-6">
                            <div className="flex flex-col border-l-2 border-slate-100 pl-4 gap-4">
                              {tx.type === "Payment" ? (
                                <span className="text-slate-700 font-bold text-sm flex items-center gap-2">
                                  <TrendingUp size={14} className="text-emerald-500" />
                                  {tx.particulars}
                                </span>
                              ) : (
                                <div className="space-y-4">
                                  {tx.items?.map((item: any, iidx: number) => (
                                    <div key={iidx} className="space-y-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-2">
                                        <Package size={14} className="text-indigo-500" />
                                        <span className="text-slate-700 font-bold text-sm">{item.product}</span>
                                        <span className="text-slate-400 text-xs font-medium">({item.qty} × ₹{item.rate})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {item.office && (
                                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase">
                                            <Building2 size={10} /> {item.office}
                                          </div>
                                        )}
                                        {item.staff?.map((s: any, sidx: number) => (
                                          <div key={sidx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${s.role === 'driver' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                                            {s.role === 'driver' ? <User size={10} /> : <HardHat size={10} />} {s.name}
                                          </div>
                                        ))}
                                        {item.vehicle && (
                                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                                            <Truck size={10} /> {item.vehicle}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 border-dashed">
                                    {tx.raw?.transport_charge > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-indigo-100 bg-white text-indigo-400 text-[10px] font-black uppercase">
                                        <Navigation size={12} /> Transport: ₹{tx.raw.transport_charge}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <span className="text-slate-400 text-xs font-semibold pt-1">Total: ₹{tx.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-emerald-600">
                          {tx.debit > 0 && `₹${tx.debit.toLocaleString()}`}
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-slate-900">
                          {tx.credit > 0 && `₹${tx.credit.toLocaleString()}`}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (tx.type === "Dispatch") {
                                  navigate(`/customer/add-material/${id}`, { state: { editData: tx.raw, customerName: customer?.name } });
                                } else {
                                  setEditPaymentData(tx.raw);
                                  setIsPaymentModalOpen(true);
                                }
                              }}
                              className="p-3 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(tx.type, tx.id);
                              }}
                              className="p-3 bg-slate-50 hover:bg-red-600 hover:text-white rounded-xl text-slate-400 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-8 py-10 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center gap-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ledgerEntries.length)} of {ledgerEntries.length} entries
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-2 max-w-[250px] md:max-w-[400px] overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          id={`ledger-page-btn-${pageNum}`}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === pageNum
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                            : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CALL LOG MODAL */}
      {isCallModalOpen && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={(e) => { e.stopPropagation(); setIsCallModalOpen(false); }} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Log Call</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Communication Remark</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsCallModalOpen(false); }}
                className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
              >
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
                      onChange={(e) => setCallDetails({ ...callDetails, date: e.target.value })}
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
                      onChange={(e) => setCallDetails({ ...callDetails, nextDate: e.target.value })}
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
                  onChange={(e) => setCallDetails({ ...callDetails, remark: e.target.value })}
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
        </div>,
        document.body
      )}


      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditPaymentData(null);
          loadData();
        }}
        customerId={id || ""}
        editData={editPaymentData}
      />

      <ExportLedgerModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        customer={customer}
        ledgerEntries={ledgerEntries}
      />
    </div>
  );
};

export default CustomerDetails;