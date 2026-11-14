import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, Package, TrendingUp,
  Loader2, Truck, Plus, Wallet,
  PhoneCall, X, BellRing, User, HardHat, Building2,
  Pencil, Trash2, CreditCard, Navigation,
  ChevronLeft, ChevronRight, Download
} from "lucide-react";
import { fetchCustomerById, deleteCustomerStatement, updateCustomer } from "../../../api/customer";
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

  // Edit Due (Balance) Modal State
  const [isEditDueModalOpen, setIsEditDueModalOpen] = useState(false);
  const [editDueAmount, setEditDueAmount] = useState<string>("0");
  const [isSavingDue, setIsSavingDue] = useState(false);

  const [callDetails, setCallDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    remark: "",
    nextDate: ""
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const loadData = async () => {
    if (!id || id === 'new' || isNaN(Number(id))) {
      if (id === 'new') {
        navigate('/customers', { replace: true });
      }
      return;
    }
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
    // Real authoritative balance from DB customer table (preserves edited due amount)
    const balance = (customer.balance !== undefined && customer.balance !== null)
      ? Number(customer.balance)
      : (credit - debit);
    return { debit, credit, balance };
  }, [customer]);

  const handleUpdateDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const numVal = parseFloat(editDueAmount);
    if (isNaN(numVal)) {
      toast.error("Please enter a valid balance amount");
      return;
    }
    try {
      setIsSavingDue(true);
      await updateCustomer(Number(id), { balance: numVal });
      toast.success(`Outstanding balance updated to ₹${numVal.toLocaleString('en-IN')}`);
      setIsEditDueModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Failed to update balance:", error);
      toast.error(error?.message || "Failed to update balance");
    } finally {
      setIsSavingDue(false);
    }
  };

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
          })),
          places: item.places
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
    <div className="space-y-6 animate-in font-sans relative">
      {loading ? (
        <div className="h-screen flex items-center justify-center bg-[#FBFDFF] absolute inset-0 z-50">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ─── HEADER & ACTIONS ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <ArrowLeft size={12} /> Client Hub
                </button>
                <span className="text-xs font-bold text-slate-400">• Account #{customer.id}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditDueAmount(String(customer?.balance ?? totals.balance ?? 0));
                    setIsEditDueModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 rounded-full font-bold text-[11px] transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <Pencil size={11} className="text-amber-600" />
                  <span>Edit Due</span>
                </button>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {customer.name} <span className="text-indigo-600">Ledger</span>
              </h1>
              <p className="text-xs font-medium text-slate-500">
                Real-time material delivery history, payments & statement reconciliation
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCallModalOpen(true);
                }}
                className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-xs text-slate-700 hover:text-indigo-600 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <PhoneCall size={14} className="text-indigo-600" />
                <span>Call Log</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExportModalOpen(true);
                }}
                className="h-10 px-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl font-bold text-xs text-slate-700 hover:text-indigo-600 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download size={14} className="text-slate-500" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditDueAmount(String(customer?.balance ?? totals.balance ?? 0));
                  setIsEditDueModalOpen(true);
                }}
                className="h-10 px-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl font-bold text-xs text-amber-800 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Pencil size={14} className="text-amber-600" />
                <span>Edit Due</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditPaymentData(null);
                  setIsPaymentModalOpen(true);
                }}
                className="h-10 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl font-bold text-xs text-emerald-700 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CreditCard size={15} />
                <span>Record Payment</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/customer/add-material/${id}`, { state: { customerName: customer?.name } });
                }}
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
              >
                <Plus size={16} />
                <span>Add Material</span>
              </button>
            </div>
          </div>

          {/* ─── BALANCE & STATS CARDS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Outstanding Balance */}
            <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-2xs flex items-center justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Outstanding Balance</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDueAmount(String(customer?.balance ?? totals.balance ?? 0));
                      setIsEditDueModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded-md transition-colors"
                    title="Click to edit due amount"
                  >
                    <Pencil size={10} /> Edit Due
                  </button>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-white">₹{totals.balance.toLocaleString('en-IN')}</p>
                  {totals.balance === 0 && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Settled
                    </span>
                  )}
                </div>
              </div>
              <div className="size-11 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 z-10">
                <Wallet size={18} />
              </div>
            </div>

            {/* Total Billed */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Billed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{totals.credit.toLocaleString('en-IN')}</p>
              </div>
              <div className="size-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <Package size={18} />
              </div>
            </div>

            {/* Total Paid */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Paid</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">₹{totals.debit.toLocaleString('en-IN')}</p>
              </div>
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <TrendingUp size={18} />
              </div>
            </div>
          </div>

          {/* ─── LEDGER TABLE ─── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 sm:px-6">Date & Ref</th>
                    <th className="py-3 px-4">Item Particulars & Logistics</th>
                    <th className="py-3 px-4 text-right">Debit (Paid)</th>
                    <th className="py-3 px-4 text-right">Credit (Dispatch)</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEntries.map((tx: any) => {
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors align-top group">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap">
                              <Calendar size={13} className="text-slate-400" /> {tx.date}
                            </span>
                            <span className="text-indigo-600 text-[10px] font-black mt-0.5 uppercase tracking-wider">{tx.id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-3">
                            <div className="flex flex-col border-l-2 border-slate-100 pl-3 gap-2.5">
                              {tx.type === "Payment" ? (
                                <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                                  <TrendingUp size={13} className="text-emerald-500" />
                                  {tx.particulars}
                                </span>
                              ) : (
                                <div className="space-y-2.5">
                                  {tx.items?.map((item: any, iidx: number) => (
                                    <div key={iidx} className="space-y-1 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-2">
                                        <Package size={13} className="text-indigo-500 shrink-0" />
                                        <span className="text-slate-800 font-bold text-xs">{item.product}</span>
                                        <span className="text-slate-400 text-[11px] font-medium">({item.qty} × ₹{item.rate})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
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
                                        {item.places && (
                                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase">
                                            <Navigation size={10} /> {item.places}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 border-dashed">
                                    {tx.raw?.transport_charge > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-indigo-100 bg-white text-indigo-500 text-[10px] font-bold uppercase">
                                        <Navigation size={11} /> Transport: ₹{tx.raw.transport_charge}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              <span className="text-slate-400 text-[11px] font-semibold">Total: ₹{tx.amount.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-xs text-emerald-600">
                          {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-xs text-slate-900">
                          {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
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
                              className="size-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(tx.type, tx.id);
                              }}
                              className="size-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
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
              <div className="px-4 sm:px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, ledgerEntries.length)} of {ledgerEntries.length} entries
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <div className="flex items-center gap-1 max-w-[200px] sm:max-w-[300px] overflow-x-auto no-scrollbar py-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          id={`ledger-page-btn-${pageNum}`}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`size-8 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-white border border-slate-200/80 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
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
                    className="size-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                  >
                    <ChevronRight size={15} />
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
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/80">
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
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <PhoneCall size={16} />
                <span>Save Call Entry</span>
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}


      {/* EDIT DUE MODAL */}
      {isEditDueModalOpen && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            onClick={(e) => {
              e.stopPropagation();
              if (!isSavingDue) setIsEditDueModalOpen(false);
            }}
          />
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-slate-200/80">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Update Balance</h3>
                  <p className="text-slate-500 text-xs font-semibold">Account #{customer?.id} • {customer?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingDue && setIsEditDueModalOpen(false)}
                className="size-8 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateDue} className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Edit outstanding opening balance for <span className="font-bold text-slate-800">{customer?.name}</span>. Setting to ₹0 marks this account as settled.
              </p>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditDueAmount("0")}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200/80 transition-all cursor-pointer"
                >
                  ₹0 (Settled)
                </button>
                <button
                  type="button"
                  onClick={() => setEditDueAmount((prev) => String((parseFloat(prev) || 0) + 500))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 transition-all cursor-pointer"
                >
                  +₹500
                </button>
                <button
                  type="button"
                  onClick={() => setEditDueAmount((prev) => String((parseFloat(prev) || 0) + 1000))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 transition-all cursor-pointer"
                >
                  +₹1,000
                </button>
                <button
                  type="button"
                  onClick={() => setEditDueAmount((prev) => String((parseFloat(prev) || 0) + 5000))}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 transition-all cursor-pointer"
                >
                  +₹5,000
                </button>
              </div>

              {/* Input field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Outstanding Balance (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editDueAmount}
                    onChange={(e) => setEditDueAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-black text-slate-900 text-lg focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingDue}
                  onClick={() => setIsEditDueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDue}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSavingDue ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Pencil size={14} />
                      <span>Save Balance</span>
                    </>
                  )}
                </button>
              </div>
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