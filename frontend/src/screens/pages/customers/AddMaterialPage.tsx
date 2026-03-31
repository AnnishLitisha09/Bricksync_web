import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  X,
  Package,
  Truck,
  Upload,
  CheckCircle2,
  Hash,
  IndianRupee,
  Building2,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  ShieldX,
  ArrowLeft,
  Calendar,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllOffices, getAllProducts, getEmployees, getStock } from "../../../api/inventory";
import { fetchVehicles } from "../../../api/vehicle";
import { createOrder, updateOrder, bulkImportOrders } from "../../../api/order";
import { fetchCustomerById, fetchCustomers } from "../../../api/customer";
import { parseLedgerPdf, type ParsedLedger } from "../../../utils/parseLedgerPdf";
import { toast } from "react-hot-toast";

/**
 * Computes a simple similarity ratio between two strings (0-1).
 */
function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 1;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length < nb.length ? na : nb;
  let matches = 0;
  let start = 0;
  for (const ch of shorter) {
    const idx = longer.indexOf(ch, start);
    if (idx !== -1) {
      matches++;
      start = idx + 1;
    }
  }
  return matches / longer.length;
}

const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 block";
const inputClass = "w-full px-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm";

const AddMaterialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [entryMode, setEntryMode] = useState<"today" | "bulk">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState<string>(location.state?.customerName || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(id && id !== 'new' ? id : "");
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [options, setOptions] = useState<{
    offices: any[];
    vehicles: any[];
    products: any[];
    employees: any[];
    stocks: any[];
  }>({
    offices: [],
    vehicles: [],
    products: [],
    employees: [],
    stocks: [],
  });

  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportCharge, setTransportCharge] = useState<string>("0");

  const [materials, setMaterials] = useState([
    {
      id: Date.now(),
      office_id: "",
      material_id: "",
      particulars: "",
      qty: "",
      rate: "",
      vehicle_id: "",
      driver_ids: [] as number[],
      loader_ids: [] as number[],
      loader_charge_per_unit: ""
    }
  ]);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedLedger, setParsedLedger] = useState<ParsedLedger | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [nameMatchResult, setNameMatchResult] = useState<{
    pdfName: string;
    score: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!customerName && id && id !== 'new') {
      fetchCustomerById(id).then(res => setCustomerName(res.data.name)).catch(() => {});
    }

    if (!id || id === 'new') {
      fetchCustomers("", 1, 1000).then(res => setAllCustomers(res.data || [])).catch(() => {});
    }

    const fetchOptions = async () => {
      try {
        const [offices, vehicles, products, employees, stocks] = await Promise.all([
          getAllOffices(),
          fetchVehicles(),
          getAllProducts(),
          getEmployees(),
          getStock(),
        ]);
        setOptions({
          offices: offices.data || [],
          vehicles: vehicles || [],
          products: products.data || [],
          employees: employees.data || [],
          stocks: stocks || [],
        });
      } catch (error) {
        toast.error("Failed to load options");
      } finally {
      }
    };
    fetchOptions();

    if (editData) {
      const formattedDate = editData.date
        ? (editData.date.includes('T') ? editData.date.split('T')[0] : editData.date)
        : new Date().toISOString().split('T')[0];

      setGlobalDate(formattedDate);
      setTransportCharge(editData.transport_charge?.toString() || "0");

      if (editData.items && editData.items.length > 0) {
        setMaterials(editData.items.map((item: any) => ({
          id: item.id,
          office_id: item.office_id?.toString() || "",
          material_id: item.material_id?.toString() || "",
          particulars: item.product || "",
          qty: item.quantity?.toString() || "",
          rate: item.price?.toString() || "",
          vehicle_id: item.vehicle_id?.toString() || "",
          driver_ids: item.orderEmployees?.filter((oe: any) => oe.role === 'driver').map((oe: any) => oe.employee_id) || [],
          loader_ids: item.orderEmployees?.filter((oe: any) => oe.role === 'loader').map((oe: any) => oe.employee_id) || [],
          loader_charge_per_unit: item.loader_charge_per_unit?.toString() || "",
        })));
      }
    }
  }, [id, editData]);

  const mergedPreviewRows = useMemo(() => {
    if (!parsedLedger) return [];
    const toMs = (d: string) => {
      const [dd, mm, yyyy] = d.split('-');
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };
    const rows: any[] = [
      ...parsedLedger.orders.map(o => ({ type: 'order', date: o.date, index: o.originalIndex || 0, data: o })),
      ...parsedLedger.payments.map(p => ({ type: 'payment', date: p.date, index: p.originalIndex || 0, data: p })),
    ];
    if (parsedLedger.openingBalance > 0) {
      const earliestDate = [...parsedLedger.orders, ...parsedLedger.payments]
        .map(o => o.date)
        .sort((a, b) => toMs(a) - toMs(b))[0] || "01-01-2026";
      rows.push({ type: 'opening', date: earliestDate, index: -1, data: { amount: parsedLedger.openingBalance } });
    }
    return rows.sort((a, b) => {
      const dateDiff = toMs(a.date) - toMs(b.date);
      return dateDiff !== 0 ? dateDiff : a.index - b.index;
    });
  }, [parsedLedger]);

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBulkFile(file);
    setParsedLedger(null);
    setNameMatchResult(null);
    if (!file) return;
    setIsParsing(true);
    try {
      const result = await parseLedgerPdf(file);
      setParsedLedger(result);
      if (customerName && result.customerName) {
        const score = nameSimilarity(result.customerName, customerName);
        const passed = score >= 0.80;
        setNameMatchResult({ pdfName: result.customerName, score, passed });
      }
    } catch (err: any) {
      toast.error("Failed to parse PDF");
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    const customerIdToUse = id && id !== 'new' ? Number(id) : Number(selectedCustomerId);
    if (!customerIdToUse) {
      toast.error("Please select a customer");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!parsedLedger) {
        toast.error("No data to import");
        return;
      }
      const result = await bulkImportOrders({
        cus_id: customerIdToUse,
        orders: parsedLedger.orders,
        payments: parsedLedger.payments,
        openingBalance: parsedLedger.openingBalance || 0,
      });
      toast.success(`Imported ${result.ordersCreated} orders!`);
      navigate(`/customer/details/${customerIdToUse}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Bulk import failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const customerIdToUse = id && id !== 'new' ? Number(id) : Number(selectedCustomerId);
    if (!customerIdToUse) {
      toast.error("Please select a customer");
      return;
    }

    for (const mat of materials) {
      if (!mat.office_id || !mat.material_id || !mat.qty || !mat.rate) {
        toast.error("Please fill all required fields");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload = {
        cus_id: customerIdToUse,
        date: globalDate,
        transport_charge: Number(transportCharge),
        items: materials.map(m => ({
          product: m.particulars,
          office_id: Number(m.office_id),
          material_id: Number(m.material_id),
          quantity: Number(m.qty),
          price: Number(m.rate),
          vehicle_id: Number(m.vehicle_id),
          driver_ids: m.driver_ids,
          loader_ids: m.loader_ids,
          loader_charge_per_unit: Number(m.loader_charge_per_unit) || 0,
        }))
      };
      if (editData) {
        await updateOrder(editData.order_id, payload);
        toast.success("Dispatch updated!");
      } else {
        await createOrder(payload);
        toast.success("Dispatch confirmed!");
      }
      navigate(`/customer/details/${id}`);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Submission failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaterialRow = () => {
    setMaterials([...materials, {
      id: Date.now() + Math.random(),
      office_id: "",
      material_id: "",
      particulars: "",
      qty: "",
      rate: "",
      vehicle_id: "",
      driver_ids: [],
      loader_ids: [],
      loader_charge_per_unit: "",
    }]);
  };

  const removeMaterialRow = (rowId: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== rowId));
    }
  };

  const updateMaterial = (index: number, updates: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], ...updates };
    setMaterials(updated);
  };

  const focusNext = (current: HTMLElement) => {
    const form = current.closest("form") || document.body;
    const focusables = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not([disabled])')) as HTMLElement[];
    const index = focusables.indexOf(current);
    if (index > -1 && index < focusables.length - 1) {
      focusables[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      
      if (target.tagName === "SELECT") {
        if (target instanceof HTMLSelectElement && !target.value) {
           return;
        }
      }
      
      e.preventDefault();
      focusNext(target);
    }
  };

  const materialSubtotal = materials.reduce((sum, m) => sum + (Number(m.qty) * Number(m.rate)), 0);
  const loaderSalaryTotal = materials.reduce((sum, m) => sum + (Number(m.qty) * (Number(m.loader_charge_per_unit) || 0)), 0);
  const finalTotal = materialSubtotal + Number(transportCharge);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 pb-24 font-sans" onKeyDown={handleKeyDown}>
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-4"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
              Material <span className="text-indigo-600">{editData ? "Edit" : "Entry"}</span>
            </h1>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <Building2 size={14} className="text-indigo-400" /> {selectedCustomerId ? `Account: ${customerName} (#${selectedCustomerId})` : "Global Entry"}
            </p>
          </div>

          <div className="flex bg-white p-2 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <button
              onClick={() => !editData && setEntryMode("today")}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === "today" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:bg-slate-50"}`}
            >
              Today Entry
            </button>
            <button
              onClick={() => !editData && setEntryMode("bulk")}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === "bulk" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-400 hover:bg-slate-50"}`}
              disabled={!!editData}
            >
              Bulk Import
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Calendar size={20}/></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Entry Date</p>
                      <input 
                        type="date" 
                        className="text-lg font-black bg-transparent outline-none mt-1" 
                        value={globalDate} 
                        onChange={(e) => setGlobalDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {(!id || id === 'new') && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20}/></div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Select Customer</p>
                        <select 
                          className="w-full text-lg font-black bg-transparent outline-none mt-1 appearance-none"
                          value={selectedCustomerId}
                          onChange={(e) => {
                            const c = allCustomers.find(cu => String(cu.id) === e.target.value);
                            setSelectedCustomerId(e.target.value);
                            setCustomerName(c?.name || "");
                          }}
                        >
                          <option value="">Select Customer</option>
                          {allCustomers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone_no}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {materials.map((mat, index) => (
                  <motion.div
                    key={mat.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-20 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-center mb-8">
                      <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">Item Entry #{index + 1}</span>
                      {index > 0 && (
                        <button type="button" onClick={() => removeMaterialRow(mat.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className={labelClass}>Dispatch Office</label>
                        <div className="relative">
                           <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <select className={`${inputClass} pl-12 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all`} value={mat.office_id} onChange={(e) => updateMaterial(index, { office_id: e.target.value })}>
                              <option value="">Select Office</option>
                              {options.offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                           </select>
                        </div>
                      </div>

                      <div className="relative">
                        <label className={labelClass}>Material</label>
                        <div className="relative">
                           <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <select 
                              className={`${inputClass} pl-12 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all`} 
                              value={mat.material_id} 
                              onChange={(e) => {
                                const prod = options.products.find(p => String(p.product_id) === e.target.value);
                                updateMaterial(index, { material_id: e.target.value, particulars: prod?.product_name || "" });
                                if (e.target.value) focusNext(e.target);
                              }}
                              disabled={!mat.office_id}
                           >
                              <option value="">Select Material</option>
                              {options.products.map(p => {
                                 const stock = options.stocks.find(s => s.product_id === p.product_id && s.office_id === Number(mat.office_id));
                                 return <option key={p.product_id} value={p.product_id}>{p.product_name} ({stock?.quantity || 0} left)</option>
                              })}
                           </select>
                        </div>
                      </div>

                      <div className="relative">
                        <label className={labelClass}>Vehicle</label>
                        <div className="relative">
                           <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <select className={`${inputClass} pl-12 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all`} value={mat.vehicle_id} onChange={(e) => updateMaterial(index, { vehicle_id: e.target.value })}>
                              <option value="">Select Vehicle</option>
                              {options.vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                           </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className={labelClass}>Qty</label>
                            <div className="relative">
                              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input type="number" step="any" className={`${inputClass} pl-10`} placeholder="0" value={mat.qty} onChange={(e) => updateMaterial(index, { qty: e.target.value })}/>
                            </div>
                         </div>
                         <div>
                            <label className={labelClass}>Rate</label>
                            <div className="relative">
                              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                              <input type="number" step="any" className={`${inputClass} pl-10`} placeholder="0" value={mat.rate} onChange={(e) => updateMaterial(index, { rate: e.target.value })}/>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* STAFF ASSIGNMENT AREA */}
                    <div className="mt-8 pt-8 border-t border-slate-50">
                       <div className="flex items-center gap-2 mb-4">
                          <Plus size={14} className="text-indigo-600" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Staff & Charges</p>
                       </div>
                       <div className="grid grid-cols-3 gap-4">
                          <select 
                            className={`${inputClass} py-3! text-[11px]`}
                            onChange={(e) => {
                              if (e.target.value && !mat.driver_ids.includes(Number(e.target.value))) {
                                updateMaterial(index, { driver_ids: [...mat.driver_ids, Number(e.target.value)] });
                              }
                              e.target.value = "";
                            }}
                          >
                             <option value="">+ Driver</option>
                             {options.employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                          </select>
                          <select 
                            className={`${inputClass} py-3! text-[11px]`}
                            onChange={(e) => {
                              if (e.target.value && !mat.loader_ids.includes(Number(e.target.value))) {
                                updateMaterial(index, { loader_ids: [...mat.loader_ids, Number(e.target.value)] });
                              }
                              e.target.value = "";
                            }}
                          >
                             <option value="">+ Loader</option>
                             {options.employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                          </select>
                          <div className="relative">
                             <input 
                              type="number" 
                              className={`${inputClass} py-3! text-[11px] pl-8`} 
                              placeholder="Loader/Unit Charge"
                              value={mat.loader_charge_per_unit}
                              onChange={(e) => updateMaterial(index, { loader_charge_per_unit: e.target.value })}
                             />
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                          </div>
                       </div>
                       <div className="flex flex-wrap gap-2 mt-4">
                          {mat.driver_ids.map(eid => (
                            <span key={eid} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black flex items-center gap-2">
                              {options.employees.find(e => e.employee_id === eid)?.employee_name}
                              <X size={12} className="cursor-pointer" onClick={() => updateMaterial(index, { driver_ids: mat.driver_ids.filter(d => d !== eid) })}/>
                            </span>
                          ))}
                          {mat.loader_ids.map(eid => (
                            <span key={eid} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black flex items-center gap-2">
                              {options.employees.find(e => e.employee_id === eid)?.employee_name}
                              <X size={12} className="cursor-pointer" onClick={() => updateMaterial(index, { loader_ids: mat.loader_ids.filter(l => l !== eid) })}/>
                            </span>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                ))}

                {!editData && (
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="w-full py-6 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus size={20} /> Add Another Row
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                 <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video bg-white border-4 border-dashed border-slate-100 rounded-[3rem] shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center cursor-pointer group hover:border-indigo-500/30 hover:bg-indigo-50/30 transition-all"
                 >
                    <div className="p-8 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-100 group-hover:scale-110 transition-transform">
                      {isParsing ? <Loader2 size={48} className="animate-spin" /> : bulkFile ? <CheckCircle2 size={48} className="text-emerald-500" /> : <Upload size={48} />}
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mt-8 mb-2 uppercase tracking-tight">{bulkFile ? bulkFile.name : "Drop Ledger PDF Here"}</h3>
                    <p className="text-slate-400 text-xs font-bold font-mono tracking-widest">{isParsing ? "Reading data..." : "or click to browse documents"}</p>
                    <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                 </div>

                 {nameMatchResult && (
                   <div className={`p-6 rounded-[2rem] border-2 flex items-start gap-5 ${nameMatchResult.passed ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                      <div className={`p-3 rounded-2xl ${nameMatchResult.passed ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {nameMatchResult.passed ? <ShieldCheck size={24}/> : <ShieldX size={24}/>}
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest mb-1">{nameMatchResult.passed ? "Verified" : "Attention Required"}</p>
                         <p className="text-sm font-bold opacity-80">PDF Customer: <b>{nameMatchResult.pdfName}</b> ({Math.round(nameMatchResult.score * 100)}% match)</p>
                      </div>
                   </div>
                 )}

                 {mergedPreviewRows.length > 0 && (
                   <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                      <div className="p-6 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bulk Data Preview</p>
                      </div>
                      <div className="p-6 space-y-4">
                          {mergedPreviewRows.map((row, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${row.type === 'payment' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                               <div className="flex justify-between items-start mb-2">
                                  <div>
                                     <span className="text-[9px] font-black text-slate-400 mr-2">{row.date}</span>
                                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${row.type === 'payment' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>{row.type}</span>
                                  </div>
                                  <p className={`text-sm font-black ${row.type === 'payment' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                     {row.type === 'payment' ? '-' : ''}₹{(row.data.amount || row.data.total || 0).toLocaleString()}
                                  </p>
                               </div>
                               <p className="text-[10px] font-bold text-slate-600 truncate">
                                  {row.type === 'payment' ? `Received via ${row.data.method}` : row.data.items?.map((it:any) => it.product).join(', ')}
                                </p>
                            </div>
                          ))}
                      </div>
                   </div>
                 )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SUMMARY & SUBMIT */}
          <div className="bg-white rounded-[3rem] p-10 text-slate-900 shadow-2xl border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex-1 w-full md:w-auto">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Order Total</p>
                <h2 className="text-5xl font-black tabular-nums tracking-tighter">₹{finalTotal.toLocaleString('en-IN')}</h2>
                <div className="flex flex-wrap gap-4 mt-6">
                   <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</p>
                      <p className="text-sm font-black">{entryMode === 'today' ? materials.filter(m => m.material_id).length : parsedLedger?.orders.length || 0}</p>
                   </div>
                   <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Transport</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-20 bg-transparent text-sm font-black outline-none border-b border-slate-200 focus:border-indigo-400 transition-colors" 
                          value={transportCharge}
                          onChange={(e) => setTransportCharge(e.target.value)}
                        />
                      </div>
                   </div>
                   <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Loader Salary</p>
                      <p className="text-sm font-black text-emerald-700">₹{loaderSalaryTotal.toLocaleString()}</p>
                   </div>
                </div>
              </div>

              <button
                type="button"
                onClick={entryMode === 'today' ? () => handleSubmit() : handleBulkSubmit}
                disabled={isSubmitting || (entryMode === 'bulk' && !parsedLedger)}
                className="w-full md:w-auto px-12 py-6 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editData ? <Plus size={18} /> : <CheckCircle2 size={18} />)}
                {isSubmitting ? "Processing..." : (editData ? "Confirm Everything" : "Confirm Everything")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMaterialPage;
