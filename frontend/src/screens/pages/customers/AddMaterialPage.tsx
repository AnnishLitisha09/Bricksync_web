import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  X,
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
  Keyboard,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { fetchCreditCheck } from "../../../api/bi";
import type { CreditCheckResponse } from "../../../api/bi";
import { motion, AnimatePresence } from "framer-motion";
import { getAllOffices, getAllProducts, getEmployees, getStock } from "../../../api/inventory";
import { fetchVehicles } from "../../../api/vehicle";
import { createOrder, updateOrder, bulkImportOrders } from "../../../api/order";
import { fetchCustomerById, fetchCustomers } from "../../../api/customer";
import { createStatement } from "../../../api/statement";
import SearchableCustomerSelect from "../../../components/common/SearchableCustomerSelect";
import SearchableVehicleSelect from "../../../components/SearchableVehicleSelect";
import SearchableMaterialSelect from "../../../components/common/SearchableMaterialSelect";
import RecordPaymentModal from "./RecordPaymentModal";
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

const labelClass = "text-[11px] font-semibold text-slate-500 ml-0.5 mb-1.5 block";
const inputClass = "w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white font-medium text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all appearance-none";

const AddMaterialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [entryMode, setEntryMode] = useState<"today" | "bulk">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field element refs for sequential keyboard Enter navigation
  const dateInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<any>(null);
  const officeRefs = useRef<(HTMLSelectElement | null)[]>([]);
  const materialRefs = useRef<(HTMLInputElement | null)[]>([]);
  const vehicleRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const rateRefs = useRef<(HTMLInputElement | null)[]>([]);
  const driverRefs = useRef<(HTMLSelectElement | null)[]>([]);
  const loaderRefs = useRef<(HTMLSelectElement | null)[]>([]);
  const loaderChargeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const addMaterialButtonRef = useRef<HTMLButtonElement>(null);
  const transportChargeRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const dispatchWithPaymentButtonRef = useRef<HTMLButtonElement>(null);

  const [customerName, setCustomerName] = useState<string>(location.state?.customerName || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(id && id !== 'new' ? id : "");
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [creditInfo, setCreditInfo] = useState<CreditCheckResponse | null>(null);

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

  // Focus helpers for sequential keyboard flow
  const focusOffice = (index: number) => {
    setTimeout(() => {
      officeRefs.current[index]?.focus();
    }, 30);
  };

  const focusMaterial = (index: number) => {
    setTimeout(() => {
      materialRefs.current[index]?.focus();
    }, 30);
  };

  // Auto-focus on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!id || id === 'new') {
        if (!selectedCustomerId) {
          customerSelectRef.current?.focus();
        } else {
          focusOffice(0);
        }
      } else {
        focusOffice(0);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [id, selectedCustomerId]);

  useEffect(() => {
    const custId = id && id !== 'new' ? Number(id) : Number(selectedCustomerId);
    if (custId && !isNaN(custId)) {
      fetchCreditCheck(custId)
        .then((res) => {
          if (res && res.success) {
            setCreditInfo(res);
          } else {
            setCreditInfo(null);
          }
        })
        .catch(() => setCreditInfo(null));
    } else {
      setCreditInfo(null);
    }
  }, [id, selectedCustomerId]);

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
        const officesList = offices.data || [];
        setOptions({
          offices: officesList,
          vehicles: vehicles || [],
          products: products.data || [],
          employees: employees.data || [],
          stocks: stocks || [],
        });
        if (officesList.length > 0) {
          setMaterials(prev => prev.map(m => m.office_id ? m : { ...m, office_id: String(officesList[0].office_id) }));
        }
      } catch (error) {
        toast.error("Failed to load options");
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
      customerSelectRef.current?.focus();
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
      toast.error("Please select a customer first");
      customerSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      customerSelectRef.current?.focus?.();
      customerSelectRef.current?.click?.();
      return;
    }

    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      if (!mat.office_id) {
        toast.error(`Please select dispatch office for Item #${i + 1}`);
        officeRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        officeRefs.current[i]?.focus();
        return;
      }
      if (!mat.material_id) {
        toast.error(`Please select material for Item #${i + 1}`);
        materialRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        materialRefs.current[i]?.focus();
        return;
      }
      if (!mat.qty || Number(mat.qty) <= 0) {
        toast.error(`Please enter valid quantity for Item #${i + 1}`);
        qtyRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qtyRefs.current[i]?.focus();
        return;
      }
      if (!mat.rate || Number(mat.rate) < 0) {
        toast.error(`Please enter valid rate for Item #${i + 1}`);
        rateRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rateRefs.current[i]?.focus();
        return;
      }

      // Check stock limit on client-side for immediate user feedback
      const stockItem = options.stocks.find(
        (s: any) => String(s.product_id) === String(mat.material_id) && String(s.office_id) === String(mat.office_id)
      );
      if (stockItem && Number(mat.qty) > Number(stockItem.quantity)) {
        toast.error(`Insufficient stock for "${mat.particulars || 'material'}". Available: ${stockItem.quantity}, requested: ${mat.qty}`);
        qtyRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qtyRefs.current[i]?.focus();
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
          vehicle_id: m.vehicle_id ? Number(m.vehicle_id) : undefined,
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
      navigate(`/customer/details/${customerIdToUse}`);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Submission failed";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDispatchWithPayment = () => {
    const customerIdToUse = id && id !== 'new' ? Number(id) : Number(selectedCustomerId);
    if (!customerIdToUse) {
      toast.error("Please select a customer first");
      customerSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      customerSelectRef.current?.focus?.();
      customerSelectRef.current?.click?.();
      return;
    }

    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      if (!mat.office_id) {
        toast.error(`Please select dispatch office for Item #${i + 1}`);
        officeRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        officeRefs.current[i]?.focus();
        return;
      }
      if (!mat.material_id) {
        toast.error(`Please select material for Item #${i + 1}`);
        materialRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        materialRefs.current[i]?.focus();
        return;
      }
      if (!mat.qty || Number(mat.qty) <= 0) {
        toast.error(`Please enter valid quantity for Item #${i + 1}`);
        qtyRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qtyRefs.current[i]?.focus();
        return;
      }
      if (!mat.rate || Number(mat.rate) < 0) {
        toast.error(`Please enter valid rate for Item #${i + 1}`);
        rateRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rateRefs.current[i]?.focus();
        return;
      }

      // Check stock limit on client-side for immediate user feedback
      const stockItem = options.stocks.find(
        (s: any) => String(s.product_id) === String(mat.material_id) && String(s.office_id) === String(mat.office_id)
      );
      if (stockItem && Number(mat.qty) > Number(stockItem.quantity)) {
        toast.error(`Insufficient stock for "${mat.particulars || 'material'}". Available: ${stockItem.quantity}, requested: ${mat.qty}`);
        qtyRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        qtyRefs.current[i]?.focus();
        return;
      }
    }

    setIsPaymentModalOpen(true);
  };

  const handleDispatchWithPaymentSubmit = async (paymentPayload: any) => {
    const customerIdToUse = id && id !== 'new' ? Number(id) : Number(selectedCustomerId);
    if (!customerIdToUse) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        cus_id: customerIdToUse,
        date: globalDate,
        transport_charge: Number(transportCharge),
        items: materials.map(m => ({
          product: m.particulars,
          office_id: Number(m.office_id),
          material_id: Number(m.material_id),
          quantity: Number(m.qty),
          price: Number(m.rate),
          vehicle_id: m.vehicle_id ? Number(m.vehicle_id) : undefined,
          driver_ids: m.driver_ids,
          loader_ids: m.loader_ids,
          loader_charge_per_unit: Number(m.loader_charge_per_unit) || 0,
        }))
      };

      if (editData) {
        await updateOrder(editData.order_id, orderPayload);
      } else {
        await createOrder(orderPayload);
      }

      // Record customer settlement payment
      await createStatement(paymentPayload);

      toast.success(`Dispatch confirmed & payment of ₹${Number(paymentPayload.amount).toLocaleString('en-IN')} recorded!`);
      setIsPaymentModalOpen(false);
      navigate(`/customer/details/${customerIdToUse}`);
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to process dispatch and payment";
      throw new Error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMaterialRow = () => {
    const lastRow = materials[materials.length - 1];
    setMaterials(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        office_id: lastRow?.office_id || (options.offices[0]?.office_id?.toString() || ""),
        material_id: "",
        particulars: "",
        qty: "",
        rate: "",
        vehicle_id: lastRow?.vehicle_id || "",
        driver_ids: lastRow?.driver_ids ? [...lastRow.driver_ids] : [],
        loader_ids: lastRow?.loader_ids ? [...lastRow.loader_ids] : [],
        loader_charge_per_unit: lastRow?.loader_charge_per_unit || "",
      }
    ]);
    setTimeout(() => {
      const newIndex = materials.length;
      materialRefs.current[newIndex]?.focus();
    }, 60);
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

  // Global keyboard shortcuts (Cmd+Enter / Ctrl+Enter submits instantly from anywhere)
  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (entryMode === "today") {
        handleSubmit();
      } else {
        handleBulkSubmit();
      }
    }
  };

  const materialSubtotal = materials.reduce((sum, m) => sum + (Number(m.qty) * Number(m.rate)), 0);
  const loaderSalaryTotal = materials.reduce((sum, m) => sum + (Number(m.qty) * (Number(m.loader_charge_per_unit) || 0)), 0);
  const finalTotal = materialSubtotal + Number(transportCharge);

  return (
    <div
      className="space-y-6 font-sans animate-in pb-16 max-w-5xl mx-auto"
      onKeyDown={handleGlobalKeyDown}
    >
      <div>
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Material {editData ? "Edit" : "Entry"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                {selectedCustomerId ? `Account: ${customerName} (#${selectedCustomerId})` : "Global Entry"}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                <Keyboard size={12} className="text-indigo-600" />
                <span>100% Keyboard Ready (Enter to Next)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dispatch orders and record material loads with instant ledger synchronization
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => !editData && setEntryMode("today")}
              className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${entryMode === "today" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"}`}
            >
              Today Entry
            </button>
            <button
              type="button"
              onClick={() => !editData && setEntryMode("bulk")}
              className={`h-8 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${entryMode === "bulk" ? "bg-white text-indigo-700 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900"}`}
              disabled={!!editData}
            >
              Bulk Import
            </button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. ENTRY DATE */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-3.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar size={18}/>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Entry Date (Press Enter)
                      </label>
                      <input 
                        ref={dateInputRef}
                        type="date" 
                        className="text-sm font-bold text-slate-800 bg-transparent outline-none w-full cursor-pointer" 
                        value={globalDate} 
                        onChange={(e) => setGlobalDate(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (!id || id === 'new') {
                              customerSelectRef.current?.focus();
                            } else {
                              focusOffice(0);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* 2. CUSTOMER ACCOUNT */}
                  {(!id || id === 'new') && (
                    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Select Customer Account (Type Name or Enter)
                        </label>
                        {selectedCustomerId && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            Account #{selectedCustomerId}
                          </span>
                        )}
                      </div>
                      <SearchableCustomerSelect
                        inputRef={customerSelectRef}
                        customers={allCustomers}
                        value={selectedCustomerId}
                        onChange={(cId, cust) => {
                          setSelectedCustomerId(cId);
                          setCustomerName(cust?.name || "");
                        }}
                        onSelectNext={() => focusOffice(0)}
                        placeholder="Search or click client from dropdown..."
                      />
                    </div>
                  )}
                </div>

                {/* SMART CREDIT LOCK ALERT */}
                {creditInfo && creditInfo.isLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="size-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Smart Credit Lock Active
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            Credit Limit ₹{creditInfo.creditLimit.toLocaleString("en-IN")} Exceeded!
                          </span>
                        </div>
                        <p className="text-xs font-bold text-rose-950 mt-1">
                          Current Outstanding Balance: <span className="text-rose-600 font-black">₹{creditInfo.balance.toLocaleString("en-IN")}</span>
                          {creditInfo.exceededBy > 0 && ` • ₹${creditInfo.exceededBy.toLocaleString("en-IN")} over limit (${creditInfo.agingCategory})`}
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                          Unsettled delivery risk detected. Settle dues immediately or proceed using <span className="font-black text-emerald-700">Dispatch with Payment</span> below.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenDispatchWithPayment}
                      className="w-full md:w-auto h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Wallet size={14} />
                      <span>Settle & Dispatch Now</span>
                    </button>
                  </motion.div>
                )}

                {/* 3. MATERIAL ITEMS LIST */}
                {materials.map((mat, index) => (
                  <motion.div
                    key={mat.id}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs relative group"
                  >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">Material Item #{index + 1}</h3>
                      </div>
                      {index > 0 && (
                        <button 
                          type="button" 
                          onClick={() => removeMaterialRow(mat.id)} 
                          className="h-8 px-2.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Remove Item</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DISPATCH OFFICE */}
                      <div className="relative">
                        <label className={labelClass}>Dispatch Office</label>
                        <div className="relative">
                           <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                           <select 
                             ref={(el) => { officeRefs.current[index] = el; }}
                             className={`${inputClass} pl-12 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer`} 
                             value={mat.office_id} 
                             onChange={(e) => updateMaterial(index, { office_id: e.target.value })}
                             onKeyDown={(e) => {
                               if (e.key === "Enter") {
                                 e.preventDefault();
                                 focusMaterial(index);
                               }
                             }}
                           >
                              <option value="">Select Office</option>
                              {options.offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                           </select>
                        </div>
                      </div>

                      {/* MATERIAL (SEARCHABLE DROPDOWN WITH INSTANT 'XL' FILTERING) */}
                      <div className="relative">
                        <label className={labelClass}>
                          Material <span className="text-indigo-600 font-bold">(Type 'xl' or name to filter)</span>
                        </label>
                        <SearchableMaterialSelect
                          inputRef={(el) => { materialRefs.current[index] = el; }}
                          products={options.products}
                          stocks={options.stocks}
                          officeId={mat.office_id}
                          value={mat.material_id}
                          onChange={(pId, pName, defaultPrice) => {
                            const updates: any = { material_id: pId, particulars: pName };
                            if (defaultPrice !== undefined && (!mat.rate || mat.rate === "0" || mat.rate === "")) {
                              updates.rate = String(defaultPrice);
                            }
                            updateMaterial(index, updates);
                          }}
                          onSelectNext={() => {
                            setTimeout(() => vehicleRefs.current[index]?.focus(), 30);
                          }}
                          placeholder="Select Material (type 'xl', name)..."
                          disabled={!mat.office_id}
                        />
                      </div>

                      {/* VEHICLE */}
                      <div>
                        <label className={labelClass}>Vehicle</label>
                        <SearchableVehicleSelect
                          inputRef={(el) => { vehicleRefs.current[index] = el; }}
                          vehicles={options.vehicles}
                          value={mat.vehicle_id}
                          onChange={(vId) => updateMaterial(index, { vehicle_id: vId })}
                          onSelectNext={() => {
                            setTimeout(() => qtyRefs.current[index]?.focus(), 30);
                          }}
                          placeholder="Search or pick vehicle..."
                        />
                      </div>

                      {/* QTY & RATE */}
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className={labelClass}>Qty</label>
                            <div className="relative">
                              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                              <input 
                                ref={(el) => { qtyRefs.current[index] = el; }}
                                type="number" 
                                step="any" 
                                className={`${inputClass} pl-10`} 
                                placeholder="0" 
                                value={mat.qty} 
                                onChange={(e) => updateMaterial(index, { qty: e.target.value })}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    rateRefs.current[index]?.focus();
                                  }
                                }}
                              />
                            </div>
                         </div>
                         <div>
                            <label className={labelClass}>Rate</label>
                            <div className="relative">
                              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                              <input 
                                ref={(el) => { rateRefs.current[index] = el; }}
                                type="number" 
                                step="any" 
                                className={`${inputClass} pl-10`} 
                                placeholder="0" 
                                value={mat.rate} 
                                onChange={(e) => updateMaterial(index, { rate: e.target.value })}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                      submitButtonRef.current?.focus();
                                    } else {
                                      driverRefs.current[index]?.focus();
                                    }
                                  }
                                }}
                              />
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* STAFF ASSIGNMENT AREA */}
                    <div className="mt-8 pt-8 border-t border-slate-50">
                       <div className="flex items-center gap-2 mb-4">
                          <Plus size={14} className="text-indigo-600" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Staff & Charges (Optional)</p>
                       </div>
                       <div className="grid grid-cols-3 gap-4">
                          <select 
                            ref={(el) => { driverRefs.current[index] = el; }}
                            className={`${inputClass} py-3! text-[11px] cursor-pointer`}
                            onChange={(e) => {
                              if (e.target.value && !mat.driver_ids.includes(Number(e.target.value))) {
                                updateMaterial(index, { driver_ids: [...mat.driver_ids, Number(e.target.value)] });
                              }
                              e.target.value = "";
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                loaderRefs.current[index]?.focus();
                              }
                            }}
                          >
                             <option value="">+ Driver</option>
                             {options.employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                          </select>
                          <select 
                            ref={(el) => { loaderRefs.current[index] = el; }}
                            className={`${inputClass} py-3! text-[11px] cursor-pointer`}
                            onChange={(e) => {
                              if (e.target.value && !mat.loader_ids.includes(Number(e.target.value))) {
                                updateMaterial(index, { loader_ids: [...mat.loader_ids, Number(e.target.value)] });
                              }
                              e.target.value = "";
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                loaderChargeRefs.current[index]?.focus();
                              }
                            }}
                          >
                             <option value="">+ Loader</option>
                             {options.employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                          </select>
                          <div className="relative">
                             <input 
                              ref={(el) => { loaderChargeRefs.current[index] = el; }}
                              type="number" 
                              className={`${inputClass} py-3! text-[11px] pl-8`} 
                              placeholder="Loader/Unit Charge"
                              value={mat.loader_charge_per_unit}
                              onChange={(e) => updateMaterial(index, { loader_charge_per_unit: e.target.value })}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (index < materials.length - 1) {
                                    focusOffice(index + 1);
                                  } else {
                                    transportChargeRef.current?.focus();
                                  }
                                }
                              }}
                             />
                             <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
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
                    ref={addMaterialButtonRef}
                    type="button"
                    onClick={addMaterialRow}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMaterialRow();
                      }
                    }}
                    className="w-full h-11 border border-dashed border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-xl text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  >
                    <Plus size={16} />
                    <span>Add Another Material Item (Press Enter)</span>
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                 <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer group transition-all"
                 >
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      {isParsing ? <Loader2 size={24} className="animate-spin" /> : bulkFile ? <CheckCircle2 size={24} className="text-emerald-500" /> : <Upload size={24} />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mt-4 mb-1">{bulkFile ? bulkFile.name : "Drop Ledger PDF Here"}</h3>
                    <p className="text-slate-400 text-xs">{isParsing ? "Reading data..." : "or click to browse documents"}</p>
                    <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleBulkFileChange} />
                 </div>

                 {nameMatchResult && (
                   <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${nameMatchResult.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                      <div className={`p-2 rounded-lg ${nameMatchResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {nameMatchResult.passed ? <ShieldCheck size={18}/> : <ShieldX size={18}/>}
                      </div>
                      <div>
                         <p className="text-xs font-bold mb-0.5">{nameMatchResult.passed ? "Verified Customer Identity" : "Attention Required"}</p>
                         <p className="text-xs opacity-90">PDF Customer: <span className="font-bold">{nameMatchResult.pdfName}</span> ({Math.round(nameMatchResult.score * 100)}% match)</p>
                      </div>
                   </div>
                 )}

                 {mergedPreviewRows.length > 0 && (
                   <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Bulk Data Preview</span>
                        <span className="text-[11px] text-slate-400 font-semibold">{mergedPreviewRows.length} entries</span>
                      </div>
                      <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
                          {mergedPreviewRows.map((row, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${row.type === 'payment' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-slate-50/60 border-slate-100'}`}>
                               <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-semibold text-slate-400">{row.date}</span>
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.type === 'payment' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>{row.type}</span>
                                  </div>
                                  <p className={`text-xs font-bold ${row.type === 'payment' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                     {row.type === 'payment' ? '-' : ''}₹{(row.data.amount || row.data.total || 0).toLocaleString()}
                                  </p>
                               </div>
                                <p className="text-[11px] text-slate-600 truncate">
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Order Subtotal & Charges</span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-slate-900 tabular-nums">₹{finalTotal.toLocaleString('en-IN')}</h2>
                  <span className="text-xs text-slate-400 font-semibold">Net Total</span>
                </div>
                <div className="flex flex-wrap gap-2.5 mt-4">
                   <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Items</p>
                      <p className="text-xs font-bold text-slate-800">{entryMode === 'today' ? materials.filter(m => m.material_id).length : parsedLedger?.orders.length || 0}</p>
                   </div>
                   <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Transport (₹)</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-500">₹</span>
                          <input 
                            ref={transportChargeRef}
                            type="number" 
                            className="w-16 bg-transparent text-xs font-bold outline-none text-slate-800" 
                            value={transportCharge}
                            onChange={(e) => setTransportCharge(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                submitButtonRef.current?.focus();
                              }
                            }}
                          />
                        </div>
                      </div>
                   </div>
                   <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Loader Total</p>
                      <p className="text-xs font-bold text-emerald-700">₹{loaderSalaryTotal.toLocaleString()}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 w-full md:w-auto">
                <button
                  ref={submitButtonRef}
                  type="button"
                  onClick={entryMode === 'today' ? () => handleSubmit() : handleBulkSubmit}
                  disabled={isSubmitting || (entryMode === 'bulk' && !parsedLedger)}
                  className="w-full md:w-auto h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus:ring-4 focus:ring-indigo-500/30 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (entryMode === 'today') handleSubmit();
                      else handleBulkSubmit();
                    }
                  }}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editData ? <Plus size={16} /> : <CheckCircle2 size={16} />)}
                  <span>{isSubmitting ? "Processing..." : (editData ? "Update Dispatch (Enter)" : "Confirm Dispatch (Enter)")}</span>
                </button>

                {!editData && entryMode === "today" && (
                  <button
                    ref={dispatchWithPaymentButtonRef}
                    type="button"
                    onClick={handleOpenDispatchWithPayment}
                    disabled={isSubmitting}
                    className={`w-full md:w-auto h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer focus:ring-4 focus:ring-emerald-500/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                      creditInfo?.isLocked ? "ring-4 ring-emerald-400/50 animate-pulse" : ""
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleOpenDispatchWithPayment();
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Wallet size={15} />
                        <span>Dispatch with Payment</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* RECORD PAYMENT MODAL (Customer Settlement & Ledger Balancing) */}
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          customerId={id && id !== 'new' ? id : selectedCustomerId}
          initialAmount={finalTotal > 0 ? String(finalTotal) : "0.00"}
          initialDate={globalDate}
          onPaymentSubmit={handleDispatchWithPaymentSubmit}
          title="Record Payment"
          subtitle="Customer Settlement & Ledger Balancing"
          submitButtonText="Confirm Settlement"
        />
      </div>
    </div>
  );
};

export default AddMaterialPage;
