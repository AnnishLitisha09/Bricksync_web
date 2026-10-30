import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Package,
  FileText,
  Upload,
  CheckCircle2,
  Hash,
  IndianRupee,
  Building2,
  Plus,
  Trash2,
  Navigation,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllOffices, getAllProducts, getEmployees, getStock } from "../../../api/inventory";
import { fetchVehicles } from "../../../api/vehicle";
import { createOrder, updateOrder, bulkImportOrders } from "../../../api/order";
import { parseLedgerPdf, type ParsedLedger, type ParsedOrder, type ParsedPayment } from "../../../utils/parseLedgerPdf";
import { toast } from "react-hot-toast";
import SearchableVehicleSelect from "../../../components/SearchableVehicleSelect";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName?: string; // The actual name of the customer
  editData?: any;
}

/**
 * Computes a simple similarity ratio between two strings (0-1).
 * Normalises both strings, then counts the longest common subsequence characters.
 */
function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;

  // Quick check: if one contains the other
  if (na.includes(nb) || nb.includes(na)) return 1;

  // Count matching characters using a sliding-window approach
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


const labelClass = "text-[11px] font-semibold text-slate-500 ml-0.5 mb-1 block";
const inputClass = "w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none";

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, customerId, customerName, editData }) => {
  const [entryMode, setEntryMode] = useState<"today" | "bulk">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportCharge, setTransportCharge] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

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

  // Merged date-sorted preview rows (orders + payments together)
  const mergedPreviewRows = useMemo(() => {
    if (!parsedLedger) return [] as Array<
      | { type: 'order'; date: string; data: ParsedOrder }
      | { type: 'payment'; date: string; data: ParsedPayment }
    >;
    const toMs = (d: string) => {
      const [dd, mm, yyyy] = d.split('-');
      return new Date(`${yyyy}-${mm}-${dd}`).getTime();
    };
    const rows: Array<
      | { type: 'order'; date: string; index: number; data: ParsedOrder }
      | { type: 'payment'; date: string; index: number; data: ParsedPayment }
      | { type: 'opening'; date: string; index: number; data: { amount: number } }
    > = [
        ...parsedLedger.orders.map(o => ({ type: 'order' as const, date: o.date, index: o.originalIndex || 0, data: o })),
        ...parsedLedger.payments.map(p => ({ type: 'payment' as const, date: p.date, index: p.originalIndex || 0, data: p })),
      ];

    if (parsedLedger.openingBalance > 0) {
      // Find the earliest date in orders/payments to place opening balance before them
      const earliestDate = [...parsedLedger.orders, ...parsedLedger.payments]
        .map(o => o.date)
        .sort((a, b) => toMs(a) - toMs(b))[0] || "01-01-2026";

      rows.push({
        type: 'opening' as const,
        date: earliestDate,
        index: -1, // Always first
        data: { amount: parsedLedger.openingBalance }
      });
    }

    return rows.sort((a, b) => {
      const dateDiff = toMs(a.date) - toMs(b.date);
      return dateDiff !== 0 ? dateDiff : a.index - b.index;
    });
  }, [parsedLedger]);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        // Ensure date is in YYYY-MM-DD format for input type="date"
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
        } else {
          // Fallback for legacy format if any
          setMaterials([{
            id: editData.order_id,
            office_id: editData.office_id?.toString() || "",
            material_id: editData.material_id?.toString() || "",
            particulars: editData.product || "",
            qty: editData.quantity?.toString() || "",
            rate: editData.price?.toString() || "",
            vehicle_id: editData.vehicle_id?.toString() || "",
            driver_ids: editData.orderEmployees?.filter((oe: any) => oe.role === 'driver').map((oe: any) => oe.employee_id) || [],
            loader_ids: editData.orderEmployees?.filter((oe: any) => oe.role === 'loader').map((oe: any) => oe.employee_id) || [],
            loader_charge_per_unit: editData.loader_charge_per_unit?.toString() || "",
          }]);
        }
      } else {
        setGlobalDate(new Date().toISOString().split('T')[0]);
        setTransportCharge("0");
        setMaterials([{
          id: Date.now(),
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
      }

      const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
          const [offices, vehicles, products, employees, stocks] = await Promise.all([
            getAllOffices(),
            fetchVehicles(),
            getAllProducts(),
            getEmployees(),
            getStock(), // Get all stock to filter locally
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
          setLoadingOptions(false);
        }
      };
      fetchOptions();
    }
  }, [isOpen, editData]);

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

      // Name validation
      if (customerName && result.customerName) {
        const score = nameSimilarity(result.customerName, customerName);
        const passed = score >= 0.80;
        setNameMatchResult({ pdfName: result.customerName, score, passed });
        if (!passed) {
          toast.error(`Name mismatch! PDF: "${result.customerName}" vs Customer: "${customerName}"`);
        } else {
          toast.success(`Parsed ${result.orders.length} orders and ${result.payments.length} payments`);
        }
      } else {
        toast.success(`Parsed ${result.orders.length} orders and ${result.payments.length} payments`);
      }
    } catch (err: any) {
      toast.error("Failed to parse PDF: " + (err.message || "Unknown error"));
    } finally {
      setIsParsing(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!parsedLedger) return;

    // Block import if name check failed (unless user confirms)
    if (nameMatchResult && !nameMatchResult.passed) {
      const proceed = window.confirm(
        `⚠️ Name Mismatch!\n\nPDF Customer: "${nameMatchResult.pdfName}"\nSystem Customer: "${customerName}"\nMatch: ${Math.round(nameMatchResult.score * 100)}%\n\nAre you sure you want to import this PDF for this customer?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkImportOrders({
        cus_id: Number(customerId),
        orders: parsedLedger.orders,
        payments: parsedLedger.payments,
        openingBalance: parsedLedger.openingBalance || 0,
      });
      toast.success(`Imported ${result.ordersCreated} orders and ${result.paymentsCreated} payments!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed");
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

  const removeMaterialRow = (id: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (index: number, updates: any) => {
    setMaterials(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const materialSubtotal = materials.reduce((sum, m) => sum + (Number(m.qty) * Number(m.rate)), 0);
  const finalTotal = materialSubtotal + Number(transportCharge);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < materials.length; i++) {
      if (!materials[i].office_id || !materials[i].material_id || !materials[i].qty || !materials[i].rate) {
        toast.error(`Please complete all fields for Item #${i + 1}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        cus_id: Number(customerId),
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
        await updateOrder(editData.order_id, orderPayload);
        toast.success("Dispatch updated successfully!");
      } else {
        await createOrder(orderPayload);
        toast.success("Dispatch confirmed successfully!");
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to confirm dispatch");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl p-6 md:p-7 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-black text-slate-900">
                Material {editData ? "Edit" : "Entry"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                #{customerId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <span className="font-semibold text-slate-700">{customerName || customerId}</span>
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* DATE & MODE SELECTOR */}
        <div className="flex gap-2.5 mb-5 shrink-0">
          <div className="flex-1 flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 relative">
            <button 
              type="button" 
              onClick={() => !editData && setEntryMode("today")} 
              className={`flex-1 flex items-center justify-center h-8 rounded-lg text-xs font-bold transition-all z-10 ${entryMode === "today" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-900"} ${editData ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => !editData && setEntryMode("bulk")} 
              className={`flex-1 flex items-center justify-center h-8 rounded-lg text-xs font-bold transition-all z-10 ${entryMode === "bulk" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-900"} ${editData ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Bulk
            </button>
          </div>
          <div className="w-40">
            <input 
              type="date" 
              value={globalDate} 
              onChange={(e) => setGlobalDate(e.target.value)} 
              className={inputClass} 
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                {materials.map((mat, index) => (
                  <div key={mat.id} className="p-4 md:p-5 border border-slate-200/80 rounded-2xl space-y-3.5 bg-white relative">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-md font-bold tracking-wider">Item #{index + 1}</span>
                      {index > 0 && (
                        <button type="button" onClick={() => removeMaterialRow(mat.id)} className="text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 text-[11px] font-semibold">
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    {/* OFFICE DROPDOWN */}
                    <div className="relative">
                      <label className={labelClass}>Dispatch Office</label>
                      <Building2 className="absolute left-3.5 bottom-2.5 text-slate-400 pointer-events-none" size={16} />
                      <select className={`${inputClass} pl-10`} value={mat.office_id} onChange={(e) => updateMaterial(index, { office_id: e.target.value })} required>
                        <option value="">Office...</option>
                        {options.offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                      </select>
                    </div>

                    <div className="relative">
                      <label className={labelClass}>Material Particulars</label>
                      <Package className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                      <select
                        className={`${inputClass} pl-12`}
                        value={String(mat.material_id)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const prod = options.products.find(p => p.product_id === Number(val));

                          // Consolidate both ID and Name update to prevent race conditions
                          updateMaterial(index, {
                            material_id: val,
                            particulars: prod ? (prod.product_name || (prod as any).name) : ""
                          });
                        }}
                        required
                        disabled={!mat.office_id}
                      >
                        <option value="">Select Material</option>
                        {options.products
                          .map(p => {
                            const stock = options.stocks.find(s => s.product_id === p.product_id && s.office_id === Number(mat.office_id));
                            const stockQty = stock ? Number(stock.quantity) : 0;

                            // Show if has stock OR is currently selected
                            if (stockQty > 0 || String(p.product_id) === String(mat.material_id)) {
                              return (
                                <option key={p.product_id} value={String(p.product_id)}>
                                  {p.product_name} (Stock: {stockQty})
                                </option>
                              );
                            }
                            return null;
                          })}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Vehicle Number</label>
                      <SearchableVehicleSelect
                        vehicles={options.vehicles}
                        value={mat.vehicle_id}
                        onChange={(vId) => updateMaterial(index, { vehicle_id: vId })}
                        placeholder="Select or search vehicle..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Quantity</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="number" placeholder="0" className={`${inputClass} pl-12`} value={mat.qty} onChange={(e) => updateMaterial(index, { qty: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Rate</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="number" placeholder="0.00" className={`${inputClass} pl-12`} value={mat.rate} onChange={(e) => updateMaterial(index, { rate: e.target.value })} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Amount Per Brick</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="number" placeholder="0.00" className={`${inputClass} pl-12`} value={mat.loader_charge_per_unit} onChange={(e) => updateMaterial(index, { loader_charge_per_unit: e.target.value })} required />
                        </div>
                      </div>
                    </div>

                    {/* ITEM-LEVEL STAFF SELECTION */}
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={labelClass}>Staff Assignments</label>
                        <div className="flex gap-2">
                          <select
                            className={`${inputClass} py-2! text-[10px]`}
                            value=""
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val) {
                                // Use functional update inside the component because we need the latest mat state for the list operation
                                setMaterials(prev => {
                                  const updated = [...prev];
                                  if (!updated[index].driver_ids.includes(val)) {
                                    updated[index] = {
                                      ...updated[index],
                                      driver_ids: [...updated[index].driver_ids, val]
                                    };
                                  }
                                  return updated;
                                });
                              }
                            }}
                          >
                            <option value="">+ Driver</option>
                            {options.employees
                              .filter(e => !mat.driver_ids.includes(e.employee_id))
                              .map(d => <option key={d.employee_id} value={d.employee_id}>{d.employee_name}</option>)}
                          </select>
                          <select
                            className={`${inputClass} py-2! text-[10px]`}
                            value=""
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val) {
                                setMaterials(prev => {
                                  const updated = [...prev];
                                  if (!updated[index].loader_ids.includes(val)) {
                                    updated[index] = {
                                      ...updated[index],
                                      loader_ids: [...updated[index].loader_ids, val]
                                    };
                                  }
                                  return updated;
                                });
                              }
                            }}
                          >
                            <option value="">+ Loader</option>
                            {options.employees
                              .filter(e => !mat.loader_ids.includes(e.employee_id))
                              .map(l => <option key={l.employee_id} value={l.employee_id}>{l.employee_name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto content-start pt-6">
                        {mat.driver_ids.map(id => (
                          <span key={id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold flex items-center gap-1 h-fit">
                            {options.employees.find(e => e.employee_id === id)?.employee_name}
                            <X size={10} className="cursor-pointer" onClick={() => {
                              setMaterials(prev => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  driver_ids: updated[index].driver_ids.filter(d => d !== id)
                                };
                                return updated;
                              });
                            }} />
                          </span>
                        ))}
                        {mat.loader_ids.map(id => (
                          <span key={id} className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 h-fit">
                            {options.employees.find(e => e.employee_id === id)?.employee_name}
                            <X size={10} className="cursor-pointer" onClick={() => {
                              setMaterials(prev => {
                                const updated = [...prev];
                                updated[index] = {
                                  ...updated[index],
                                  loader_ids: updated[index].loader_ids.filter(l => l !== id)
                                };
                                return updated;
                              });
                            }} />
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}

                {!editData && (
                  <button
                    type="button"
                    onClick={addMaterialRow}
                    className="w-full h-10 border border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-xl text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={15} /> Add Another Material
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-full py-8 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-xl shadow-2xs border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    {isParsing ? <Loader2 size={24} className="animate-spin" /> : bulkFile ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Upload size={24} />}
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-800 px-6 text-center truncate w-full">
                    {isParsing ? "Parsing PDF..." : bulkFile ? bulkFile.name : "Upload Ledger PDF"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">M.ASWATH format supported</p>
                  <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                </div>

                {/* Preview table */}
                {parsedLedger && (
                  <div className="space-y-3">

                    {/* NAME VALIDATION BANNER */}
                    {nameMatchResult && (
                      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${nameMatchResult.passed
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-red-50 border-red-200'}`}>
                        {nameMatchResult.passed
                          ? <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                          : <ShieldX size={20} className="text-red-500 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${nameMatchResult.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                            {nameMatchResult.passed ? '✓ Customer Name Verified' : '⚠ Name Mismatch Detected'}
                          </p>
                          <p className="text-xs font-bold text-slate-600 mt-0.5">
                            PDF: <span className="font-black">{nameMatchResult.pdfName}</span>
                            <span className="mx-2 text-slate-300">•</span>
                            Match: <span className={`font-black ${nameMatchResult.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                              {Math.round(nameMatchResult.score * 100)}%
                            </span>
                          </p>
                          {!nameMatchResult.passed && (
                            <p className="text-[10px] text-red-600 mt-1 font-bold">
                              You can still import, but you will be asked to confirm.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <div className="flex-1 bg-indigo-50 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-indigo-600">{parsedLedger.orders.length}</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Orders</p>
                      </div>
                      <div className="flex-1 bg-emerald-50 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-emerald-600">{parsedLedger.payments.length}</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Payments</p>
                      </div>
                      <div className="flex-1 bg-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-lg font-black text-slate-700">
                          ₹{(parsedLedger.orders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.amount, 0), 0) + (parsedLedger.openingBalance || 0)).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Billed</p>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 z-10">
                          <tr>
                            <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-widest">Date</th>
                            <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-widest">#</th>
                            <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-widest">Particulars</th>
                            <th className="px-3 py-2.5 font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {mergedPreviewRows.map((row, i) => {
                            if (row.type === 'opening') {
                              return (
                                <tr key={`r${i}`} className="bg-amber-50/50 hover:bg-amber-50">
                                  <td className="px-3 py-2 font-bold text-slate-600 whitespace-nowrap">{row.date}</td>
                                  <td className="px-3 py-2 text-amber-500 font-black">-</td>
                                  <td className="px-3 py-2 text-amber-700 font-bold uppercase tracking-widest text-[10px]">Opening Balance</td>
                                  <td className="px-3 py-2 text-right font-black text-amber-600">&#8377;{row.data.amount.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            }
                            if (row.type === 'payment') {
                              const pay = row.data;
                              return (
                                <tr key={`r${i}`} className="bg-emerald-50/60 hover:bg-emerald-50">
                                  <td className="px-3 py-2 font-bold text-slate-600 whitespace-nowrap">{pay.date}</td>
                                  <td className="px-3 py-2 text-emerald-500 font-black">{pay.orderNumber}</td>
                                  <td className="px-3 py-2 text-emerald-700 font-bold">Payment — {pay.method}</td>
                                  <td className="px-3 py-2 text-right font-black text-emerald-600">-&#8377;{pay.amount.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            }
                            if (row.type === 'order') {
                              const order = row.data;
                              return (
                                <tr key={`r${i}`} className="hover:bg-white align-top">
                                  <td className="px-3 py-2 font-black text-slate-800 whitespace-nowrap">{order.date}</td>
                                  <td className="px-3 py-2 text-indigo-500 font-black whitespace-nowrap">{order.orderNumber}</td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {order.items.map((item: any, j: number) => (
                                      <div key={j} className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{item.product}</span>
                                        <span className="text-slate-400 ml-1">x {item.qty} @&#8377;{item.rate}</span>
                                      </div>
                                    ))}
                                  </td>
                                  <td className="px-3 py-2 text-right font-black text-slate-900 whitespace-nowrap">&#8377;{order.total.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-amber-700">Office, vehicle and staff won't be imported — you can edit each order after import.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* SUMMARY & SUBMIT */}
        <div className="pt-4 shrink-0 bg-white border-t border-slate-100 mt-2 space-y-3">
          {/* Bulk submit — only shown in bulk mode with parsed data */}
          {entryMode === "bulk" && parsedLedger && (
            <button
              type="button"
              onClick={handleBulkSubmit}
              disabled={isSubmitting}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span>{isSubmitting ? "Importing..." : `Import ${parsedLedger.orders.length} Orders & ${parsedLedger.payments.length} Payments`}</span>
            </button>
          )}

          {/* TRANSPORT CHARGE INPUT — hidden in bulk mode */}
          {entryMode !== "bulk" && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={labelClass}>Transport Charge</label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="number"
                    className={`${inputClass} pl-9`}
                    value={transportCharge}
                    onChange={(e) => setTransportCharge(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 px-4 rounded-xl flex justify-between items-center h-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</span>
                <span className="text-sm font-black text-slate-900">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Normal submit — hidden in bulk mode */}
          {entryMode !== "bulk" && (
            <button
              type="submit"
              onClick={(e) => { e.stopPropagation(); handleSubmit(e); }}
              disabled={isSubmitting || loadingOptions}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editData ? <Plus size={16} /> : <FileText size={16} />)}
              <span>{isSubmitting ? (editData ? 'Updating...' : 'Confirming...') : (editData ? 'Update Dispatch' : 'Confirm Dispatch')}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default AddMaterialModal;
