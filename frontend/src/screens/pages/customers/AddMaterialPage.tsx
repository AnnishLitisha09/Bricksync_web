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
  Layers,
} from "lucide-react";
import { fetchLoadedMaterials, type CursorLoad } from "../../../api/cursor";
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
      loader_charge_per_unit: "",
      cursor_load_id: location.state?.cursorLoadId ? String(location.state.cursorLoadId) : "",
      buy_price: "",
    }
  ]);

  // Cursor Mode State & Loaded Quarry Materials
  const [cursorMode, setCursorMode] = useState<boolean>(Boolean(location.state?.cursorLoadId));
  const [loadedCursorMaterials, setLoadedCursorMaterials] = useState<CursorLoad[]>([]);
  const [selectedCursorLoadId, setSelectedCursorLoadId] = useState<string>(
    location.state?.cursorLoadId ? String(location.state.cursorLoadId) : ""
  );
  const [showUnloadCharge, setShowUnloadCharge] = useState<boolean>(false);

  // Split Deliveries ("+ Add Another Customer / Branch")
  interface SplitDestination {
    id: number;
    destination_type: "customer" | "branch";
    target_id: string; // customerId or officeId
    target_name: string;
    qty: string;
    rate: string;
    driver_ids: number[];
    loader_ids: number[];
    loader_charge_per_unit: string;
  }
  const [splitDestinations, setSplitDestinations] = useState<SplitDestination[]>([]);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedLedger, setParsedLedger] = useState<ParsedLedger | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [nameMatchResult, setNameMatchResult] = useState<{
    pdfName: string;
    score: number;
    passed: boolean;
  } | null>(null);

  // Cross-platform key check (Mac Return, Windows Enter, Numpad Enter, keyCode 13)
  const isEnterKey = (e: React.KeyboardEvent | KeyboardEvent) => {
    return (
      e.key === "Enter" ||
      e.key === "Return" ||
      e.keyCode === 13 ||
      e.which === 13 ||
      e.code === "Enter" ||
      e.code === "NumpadEnter"
    );
  };

  // Cross-platform safe focus helper (handles Windows Chromium focus retention & animation delays)
  const safeFocus = (el: HTMLElement | null | undefined, selectText = false) => {
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      if (selectText && el instanceof HTMLInputElement) {
        try {
          el.select();
        } catch (_) {}
      }
    });
    setTimeout(() => {
      if (document.activeElement !== el) {
        el.focus();
        if (selectText && el instanceof HTMLInputElement) {
          try {
            el.select();
          } catch (_) {}
        }
      }
    }, 50);
  };

  // Focus helpers for sequential keyboard flow
  const focusOffice = (index: number) => {
    safeFocus(officeRefs.current[index]);
  };

  const focusMaterial = (index: number) => {
    safeFocus(materialRefs.current[index]);
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
        const [offices, vehicles, products, employees, stocks, loadedMatRes] = await Promise.all([
          getAllOffices(),
          fetchVehicles(),
          getAllProducts(),
          getEmployees(),
          getStock(),
          fetchLoadedMaterials().catch(() => ({ success: false, data: [] })),
        ]);
        const officesList = offices.data || [];
        const loadedList = loadedMatRes.data || [];
        setLoadedCursorMaterials(loadedList);
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

        // Auto-select load if navigated from Cursors page
        if (location.state?.cursorLoadId && loadedList.length > 0) {
          const targetLoad = loadedList.find((l: any) => String(l.id) === String(location.state.cursorLoadId));
          if (targetLoad) {
            handleSelectCursorLoad(String(targetLoad.id), loadedList, vehicles || [], employees.data || []);
          }
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

  const handleSelectCursorLoad = (
    loadId: string,
    currentLoads = loadedCursorMaterials,
    currentVehicles = options.vehicles,
    currentEmployees = options.employees
  ) => {
    setSelectedCursorLoadId(loadId);
    const found = currentLoads.find((l) => String(l.id) === loadId);
    if (!found) return;

    // 1. Auto-fill Date
    if (found.date) {
      setGlobalDate(found.date.includes("T") ? found.date.split("T")[0] : found.date);
    }

    // 2. Pre-fill customer if recorded on load
    if (found.customer_id) {
      setSelectedCustomerId(String(found.customer_id));
      if (found.customer_name) setCustomerName(found.customer_name);
    }

    // 3. Find matching vehicle in options.vehicles
    let matchedVehicleId = "";
    if (found.vehicle_id) {
      matchedVehicleId = String(found.vehicle_id);
    } else if (found.vehicle_number) {
      const v = currentVehicles.find(
        (veh) => veh.vehicleNumber?.toUpperCase() === found.vehicle_number?.toUpperCase()
      );
      if (v) matchedVehicleId = String(v.id);
    }

    // 4. Find matching driver in options.employees
    let driverIds: number[] = [];
    if (found.driver_id) {
      driverIds = [found.driver_id];
    } else if (found.driver_name) {
      const emp = currentEmployees.find(
        (e) => e.employee_name?.toLowerCase() === found.driver_name?.toLowerCase()
      );
      if (emp) driverIds = [emp.employee_id];
    }

    // 5. Update first material item with loaded product details
    setMaterials((prev) => {
      const first = prev[0] || {};
      const updated = [
        {
          ...first,
          cursor_load_id: String(found.id),
          buy_price: String(found.price_per_qty),
          particulars: found.product_name,
          material_id: found.product_id ? String(found.product_id) : first.material_id,
          office_id: first.office_id || (options.offices[0]?.office_id?.toString() || "1"),
          qty: String(found.remaining_qty),
          rate: first.rate || "", // Selling price to be entered by user or pre-set
          vehicle_id: matchedVehicleId || first.vehicle_id,
          driver_ids: driverIds.length > 0 ? driverIds : first.driver_ids,
          loader_ids: first.loader_ids || [],
          loader_charge_per_unit:
            first.loader_charge_per_unit ||
            (found.has_loading_charge ? String(found.loading_charge_per_unit || "") : ""),
        },
        ...prev.slice(1),
      ];
      return updated;
    });

    if (found.has_loading_charge && found.loading_charge_per_unit) {
      setShowUnloadCharge(true);
    }
  };

  // Add Another Customer / Branch handler
  // "when i add the another customer remove the auto filled qty alone and then for the customer i will enter 30 and for the office i will deliver 20"
  const handleAddAnotherCustomer = () => {
    // 1. Remove auto-filled qty from the first item
    setMaterials((prev) => [
      {
        ...prev[0],
        qty: "", // clear auto-filled qty so user can enter partial qty
      },
      ...prev.slice(1),
    ]);

    // 2. Add second destination (office or customer)
    const defaultOffice = options.offices[0];
    setSplitDestinations((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        destination_type: "branch",
        target_id: defaultOffice ? String(defaultOffice.office_id) : "",
        target_name: defaultOffice ? defaultOffice.office_name : "Office",
        qty: "",
        rate: "",
        driver_ids: materials[0]?.driver_ids ? [...materials[0].driver_ids] : [],
        loader_ids: materials[0]?.loader_ids ? [...materials[0].loader_ids] : [],
        loader_charge_per_unit: materials[0]?.loader_charge_per_unit || "",
      },
    ]);
    toast.success("Split destination added! Enter quantity for each destination.");
  };

  const handleRemoveSplitDestination = (splitId: number) => {
    setSplitDestinations((prev) => prev.filter((d) => d.id !== splitId));
  };

  const handleUpdateSplitDestination = (splitId: number, updates: Partial<SplitDestination>) => {
    setSplitDestinations((prev) =>
      prev.map((d) => (d.id === splitId ? { ...d, ...updates } : d))
    );
  };

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

    // In cursor mode, ensure at least one cursor load is selected if cursor materials exist
    if (cursorMode && !materials[0]?.particulars && loadedCursorMaterials.length > 0) {
      toast.error("Please select a loaded cursor material");
      return;
    }

    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      if (!cursorMode && !mat.office_id) {
        toast.error(`Please select dispatch office for Item #${i + 1}`);
        officeRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        officeRefs.current[i]?.focus();
        return;
      }
      if (!cursorMode && !mat.material_id) {
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

      // Check stock limit on client-side for immediate user feedback ONLY for non-cursor dispatches
      if (!cursorMode && !mat.cursor_load_id) {
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
    }

    // Validate split destinations
    for (let sIdx = 0; sIdx < splitDestinations.length; sIdx++) {
      const s = splitDestinations[sIdx];
      if (!s.target_id) {
        toast.error(`Please select destination for Split #${sIdx + 2} (${s.destination_type})`);
        return;
      }
      if (!s.qty || Number(s.qty) <= 0) {
        toast.error(`Please enter valid quantity for Split #${sIdx + 2}`);
        return;
      }
      if (!s.rate || Number(s.rate) < 0) {
        toast.error(`Please enter valid rate for Split #${sIdx + 2}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const branchDeliveries = splitDestinations
        .filter((d) => d.destination_type === "branch")
        .map((d) => ({
          office_id: Number(d.target_id),
          cursor_load_id: materials[0]?.cursor_load_id ? Number(materials[0].cursor_load_id) : undefined,
          product_name: materials[0]?.particulars || "Material",
          product_id: materials[0]?.material_id ? Number(materials[0].material_id) : undefined,
          quantity: Number(d.qty),
          price: Number(d.rate),
          vehicle_id: materials[0]?.vehicle_id ? Number(materials[0].vehicle_id) : undefined,
          driver_name: options.employees.find((e) => d.driver_ids.includes(e.employee_id))?.employee_name || "",
          date: globalDate,
          notes: "Split delivery from cursor to branch",
        }));

      const payload = {
        cus_id: customerIdToUse,
        date: globalDate,
        transport_charge: Number(transportCharge),
        items: materials.map(m => ({
          product: m.particulars,
          office_id: m.office_id ? Number(m.office_id) : (options.offices[0]?.office_id || 1),
          material_id: m.material_id ? Number(m.material_id) : undefined,
          quantity: Number(m.qty),
          price: Number(m.rate), // Selling price per unit
          vehicle_id: m.vehicle_id ? Number(m.vehicle_id) : undefined,
          driver_ids: m.driver_ids,
          loader_ids: m.loader_ids,
          loader_charge_per_unit: Number(m.loader_charge_per_unit) || 0,
          cursor_load_id: m.cursor_load_id ? Number(m.cursor_load_id) : undefined,
          buy_price: m.buy_price ? Number(m.buy_price) : undefined,
        })),
        branch_deliveries: branchDeliveries.length > 0 ? branchDeliveries : undefined,
      };

      if (editData) {
        await updateOrder(editData.order_id, payload);
        toast.success("Dispatch updated!");
      } else {
        await createOrder(payload);

        // Process any extra customer split deliveries
        const extraCustomerSplits = splitDestinations.filter((d) => d.destination_type === "customer");
        for (const ec of extraCustomerSplits) {
          try {
            await createOrder({
              cus_id: Number(ec.target_id),
              date: globalDate,
              items: [
                {
                  product: materials[0]?.particulars || "Material",
                  material_id: materials[0]?.material_id ? Number(materials[0].material_id) : undefined,
                  quantity: Number(ec.qty),
                  price: Number(ec.rate),
                  vehicle_id: materials[0]?.vehicle_id ? Number(materials[0].vehicle_id) : undefined,
                  driver_ids: ec.driver_ids,
                  loader_ids: ec.loader_ids,
                  loader_charge_per_unit: Number(ec.loader_charge_per_unit) || 0,
                  cursor_load_id: materials[0]?.cursor_load_id ? Number(materials[0].cursor_load_id) : undefined,
                  buy_price: materials[0]?.buy_price ? Number(materials[0].buy_price) : undefined,
                },
              ],
            });
          } catch (_) {}
        }

        if (branchDeliveries.length > 0) {
          toast.success(
            `Dispatch confirmed & ${branchDeliveries.reduce((s, b) => s + b.quantity, 0)} units added to Branch live stock!`
          );
        } else {
          toast.success("Dispatch confirmed at selling price!");
        }
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
        cursor_load_id: "",
        buy_price: "",
      }
    ]);
    setTimeout(() => {
      const newIndex = materials.length;
      safeFocus(materialRefs.current[newIndex]);
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
    if ((e.metaKey || e.ctrlKey) && isEnterKey(e)) {
      e.preventDefault();
      if (entryMode === "today") {
        handleSubmit();
      } else {
        handleBulkSubmit();
      }
    }
  };

  const materialSubtotal = materials.reduce((sum, m) => sum + (Number(m.qty) * Number(m.rate)), 0);
  const splitCustomerSubtotal = splitDestinations
    .filter((d) => d.destination_type === "customer")
    .reduce((sum, d) => sum + Number(d.qty) * Number(d.rate), 0);
  const branchDeliveriesTotal = splitDestinations
    .filter((d) => d.destination_type === "branch")
    .reduce((sum, d) => sum + Number(d.qty) * Number(d.rate), 0);

  const loaderSalaryTotal =
    materials.reduce((sum, m) => sum + Number(m.qty) * (Number(m.loader_charge_per_unit) || 0), 0) +
    splitDestinations.reduce((sum, d) => sum + Number(d.qty) * (Number(d.loader_charge_per_unit) || 0), 0);

  const finalTotal = materialSubtotal + splitCustomerSubtotal + Number(transportCharge);

  const totalDispatchedQty =
    materials.reduce((sum, m) => sum + Number(m.qty || 0), 0) +
    splitDestinations.reduce((sum, d) => sum + Number(d.qty || 0), 0);

  const totalCalculatedProfit =
    materials.reduce((sum, m) => {
      const buy = Number(m.buy_price) || 0;
      const sell = Number(m.rate) || 0;
      return sum + (sell - buy) * Number(m.qty || 0);
    }, 0) +
    splitDestinations.reduce((sum, d) => {
      const buy = Number(materials[0]?.buy_price) || 0;
      const sell = Number(d.rate) || 0;
      return sum + (sell - buy) * Number(d.qty || 0);
    }, 0);

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

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div
                key="today"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* CURSOR TOGGLE BUTTON */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        cursorMode
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight">
                          Cursor Procurement & Dispatch Mode
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            cursorMode
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {cursorMode ? "Active" : "Off"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cursorMode
                          ? "Loaded material from Cursor quarry — sell to customer with profit tracking & split delivery to branch stock"
                          : "Standard dispatch from company office stock inventory"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cursorMode}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          setCursorMode(nextVal);
                          if (nextVal && loadedCursorMaterials.length > 0 && !selectedCursorLoadId) {
                            handleSelectCursorLoad(String(loadedCursorMaterials[0].id));
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2.5 text-xs font-black text-slate-800">Cursor</span>
                    </label>
                  </div>
                </div>

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
                          if (isEnterKey(e)) {
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
                      {!cursorMode ? (
                        <>
                          {/* DISPATCH OFFICE */}
                          <div className="relative">
                            <label className={labelClass}>Dispatch Office</label>
                            <div className="relative">
                               <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                               <select 
                                 ref={(el) => { officeRefs.current[index] = el; }}
                                 className={`${inputClass} pl-12 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer`} 
                                 value={mat.office_id} 
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   updateMaterial(index, { office_id: val });
                                   if (val) {
                                     focusMaterial(index);
                                   }
                                 }}
                                 onKeyDown={(e) => {
                                   if (isEnterKey(e)) {
                                     e.preventDefault();
                                     e.stopPropagation();
                                     focusMaterial(index);
                                   }
                                 }}
                                 onKeyUp={(e) => {
                                   if (isEnterKey(e)) {
                                     e.preventDefault();
                                     e.stopPropagation();
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
                                safeFocus(vehicleRefs.current[index]);
                              }}
                              placeholder="Select Material (type 'xl', name)..."
                              disabled={!mat.office_id}
                            />
                          </div>
                        </>
                      ) : (
                        /* CURSOR LOADED MATERIAL SELECTOR (HIDDEN: DISPATCH OFFICE & MATERIAL FILTER) */
                        <div className="relative col-span-1 md:col-span-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={labelClass}>
                              Cursor Loaded Material <span className="text-indigo-600 font-bold">(Quarry loads pending delivery)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => navigate("/cursors")}
                              className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus size={12} />
                              <span>Record New Quarry Loading</span>
                            </button>
                          </div>
                          <select
                            className={`${inputClass} font-bold text-slate-800 border-indigo-200 bg-indigo-50/20 cursor-pointer`}
                            value={mat.cursor_load_id || selectedCursorLoadId}
                            onChange={(e) => handleSelectCursorLoad(e.target.value)}
                          >
                            <option value="">Select Loaded Material from Cursor...</option>
                            {loadedCursorMaterials.map((load) => (
                              <option key={load.id} value={load.id}>
                                {load.cursor?.name} — {load.product_name} | Avail: {Number(load.remaining_qty).toLocaleString()} units | Buy: ₹{Number(load.price_per_qty).toLocaleString()}/u | Veh: {load.vehicle_number} | {load.date}
                              </option>
                            ))}
                          </select>
                          {loadedCursorMaterials.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1 font-medium">
                              No active loaded cursor loads found. Go to{" "}
                              <button
                                type="button"
                                onClick={() => navigate("/cursors")}
                                className="underline font-bold"
                              >
                                Cursors
                              </button>{" "}
                              to load vehicles at quarry first.
                            </p>
                          )}
                        </div>
                      )}

                      {/* VEHICLE */}
                      <div>
                        <label className={labelClass}>Vehicle</label>
                        <SearchableVehicleSelect
                          inputRef={(el) => { vehicleRefs.current[index] = el; }}
                          vehicles={options.vehicles}
                          value={mat.vehicle_id}
                          onChange={(vId) => updateMaterial(index, { vehicle_id: vId })}
                          onSelectNext={() => {
                            safeFocus(qtyRefs.current[index], true);
                          }}
                          placeholder="Search or pick vehicle..."
                        />
                      </div>

                      {/* QTY & RATE (SELLING PRICE) */}
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
                                onFocus={(e) => {
                                  try {
                                    e.target.select();
                                  } catch (_) {}
                                }}
                                onKeyDown={(e) => {
                                  if (isEnterKey(e)) {
                                    e.preventDefault();
                                    safeFocus(rateRefs.current[index], true);
                                  }
                                }}
                              />
                            </div>
                         </div>
                         <div>
                            <label className={labelClass}>
                              {cursorMode ? "Selling Price / Unit (Rate)" : "Rate"}
                            </label>
                            <div className="relative">
                              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                              <input 
                                ref={(el) => { rateRefs.current[index] = el; }}
                                type="number" 
                                step="any" 
                                className={`${inputClass} pl-10 font-bold`} 
                                placeholder="0" 
                                value={mat.rate} 
                                onChange={(e) => updateMaterial(index, { rate: e.target.value })}
                                onFocus={(e) => {
                                  try {
                                    e.target.select();
                                  } catch (_) {}
                                }}
                                onKeyDown={(e) => {
                                  if (isEnterKey(e)) {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                      safeFocus(submitButtonRef.current);
                                    } else {
                                      safeFocus(driverRefs.current[index]);
                                    }
                                  }
                                }}
                              />
                            </div>
                         </div>
                      </div>

                      {/* PROFIT AMOUNT DISPLAY (BELOW RATE) */}
                      {cursorMode && mat.buy_price && Number(mat.buy_price) > 0 && (
                        <div className="col-span-1 md:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buy Rate:</span>
                            <span className="font-bold text-slate-700">₹{Number(mat.buy_price).toLocaleString()}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Rate:</span>
                            <span className="font-bold text-slate-900">₹{Number(mat.rate || 0).toLocaleString()}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margin:</span>
                            <span className={`font-black ${
                              Number(mat.rate || 0) >= Number(mat.buy_price) ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              ₹{(Number(mat.rate || 0) - Number(mat.buy_price)).toLocaleString()}/unit
                            </span>
                          </div>

                          <div className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                            Number(mat.rate || 0) >= Number(mat.buy_price)
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-600 text-white"
                          }`}>
                            <span>Profit:</span>
                            <span>
                              ₹{((Number(mat.rate || 0) - Number(mat.buy_price)) * (Number(mat.qty) || 0)).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STAFF ASSIGNMENT AREA */}
                    <div className="mt-8 pt-8 border-t border-slate-50">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Plus size={14} className="text-indigo-600" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Assign Staff & Charges (Optional)
                            </p>
                          </div>
                          {cursorMode && (
                            <button
                              type="button"
                              onClick={() => setShowUnloadCharge(!showUnloadCharge)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                showUnloadCharge
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <span>Unload Charge</span>
                            </button>
                          )}
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <select 
                            ref={(el) => { driverRefs.current[index] = el; }}
                            className={`${inputClass} py-3! text-[11px] cursor-pointer`}
                            onChange={(e) => {
                              if (e.target.value && !mat.driver_ids.includes(Number(e.target.value))) {
                                updateMaterial(index, { driver_ids: [...mat.driver_ids, Number(e.target.value)] });
                              }
                              e.target.value = "";
                              safeFocus(loaderRefs.current[index]);
                            }}
                            onKeyDown={(e) => {
                              if (isEnterKey(e)) {
                                e.preventDefault();
                                e.stopPropagation();
                                safeFocus(loaderRefs.current[index]);
                              }
                            }}
                            onKeyUp={(e) => {
                              if (isEnterKey(e)) {
                                e.preventDefault();
                                e.stopPropagation();
                                safeFocus(loaderRefs.current[index]);
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
                              safeFocus(loaderChargeRefs.current[index], true);
                            }}
                            onKeyDown={(e) => {
                              if (isEnterKey(e)) {
                                e.preventDefault();
                                e.stopPropagation();
                                safeFocus(loaderChargeRefs.current[index], true);
                              }
                            }}
                            onKeyUp={(e) => {
                              if (isEnterKey(e)) {
                                e.preventDefault();
                                e.stopPropagation();
                                safeFocus(loaderChargeRefs.current[index], true);
                              }
                            }}
                          >
                             <option value="">+ Loader</option>
                             {options.employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                          </select>

                          {/* LOADER / UNLOAD CHARGE */}
                          {(!cursorMode || showUnloadCharge || mat.loader_charge_per_unit) && (
                            <div className="relative">
                               <input 
                                ref={(el) => { loaderChargeRefs.current[index] = el; }}
                                type="number" 
                                className={`${inputClass} py-3! text-[11px] pl-8`} 
                                placeholder={cursorMode ? "Unload Price/Unit" : "Loader/Unit Charge"}
                                value={mat.loader_charge_per_unit}
                                onChange={(e) => updateMaterial(index, { loader_charge_per_unit: e.target.value })}
                                onFocus={(e) => {
                                  try {
                                    e.target.select();
                                  } catch (_) {}
                                }}
                                onKeyDown={(e) => {
                                  if (isEnterKey(e)) {
                                    e.preventDefault();
                                    if (index < materials.length - 1) {
                                      focusOffice(index + 1);
                                    } else {
                                      safeFocus(transportChargeRef.current, true);
                                    }
                                  }
                                }}
                               />
                               <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={12} />
                            </div>
                          )}
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

                {/* SPLIT DESTINATIONS (ADD ANOTHER CUSTOMER / BRANCH) */}
                {cursorMode && (
                  <div className="space-y-4">
                    {splitDestinations.map((split, sIdx) => (
                      <motion.div
                        key={split.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-50/40 rounded-2xl p-6 border-2 border-indigo-200 shadow-2xs relative"
                      >
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                              #{sIdx + 2}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">
                              Destination #{sIdx + 2} ({split.destination_type === "branch" ? "Branch Office" : "Customer"})
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitDestination(split.id)}
                            className="text-rose-600 text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Remove Destination</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Destination Type Toggle */}
                          <div>
                            <label className={labelClass}>Deliver To</label>
                            <div className="flex p-1 bg-white rounded-xl border border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleUpdateSplitDestination(split.id, { destination_type: "customer" })}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  split.destination_type === "customer"
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Customer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateSplitDestination(split.id, { destination_type: "branch" })}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  split.destination_type === "branch"
                                    ? "bg-indigo-600 text-white shadow-2xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                Branch (Office)
                              </button>
                            </div>
                          </div>

                          {/* Target Selector */}
                          <div className="md:col-span-2">
                            <label className={labelClass}>
                              {split.destination_type === "customer" ? "Select Customer" : "Select Branch Office"}
                            </label>
                            {split.destination_type === "customer" ? (
                              <SearchableCustomerSelect
                                customers={allCustomers}
                                value={split.target_id}
                                onChange={(cId, cust) =>
                                  handleUpdateSplitDestination(split.id, {
                                    target_id: cId,
                                    target_name: cust?.name || "",
                                  })
                                }
                                placeholder="Search or click client from dropdown..."
                              />
                            ) : (
                              <select
                                className={`${inputClass} cursor-pointer`}
                                value={split.target_id}
                                onChange={(e) => {
                                  const oId = e.target.value;
                                  const off = options.offices.find((o) => String(o.office_id) === oId);
                                  handleUpdateSplitDestination(split.id, {
                                    target_id: oId,
                                    target_name: off ? off.office_name : "Office",
                                  });
                                }}
                              >
                                <option value="">Select Branch Office to Deliver...</option>
                                {options.offices.map((o) => (
                                  <option key={o.office_id} value={o.office_id}>
                                    {o.office_name} {o.location ? `(${o.location})` : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Qty & Rate */}
                          <div>
                            <label className={labelClass}>Quantity</label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                              <input
                                type="number"
                                step="any"
                                placeholder="0"
                                className={`${inputClass} pl-9`}
                                value={split.qty}
                                onChange={(e) => handleUpdateSplitDestination(split.id, { qty: e.target.value })}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelClass}>Selling / Transfer Rate (₹)</label>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                              <input
                                type="number"
                                step="any"
                                placeholder="0"
                                className={`${inputClass} pl-9 font-bold`}
                                value={split.rate}
                                onChange={(e) => handleUpdateSplitDestination(split.id, { rate: e.target.value })}
                              />
                            </div>
                          </div>

                          {/* Destination Total calculation */}
                          <div>
                            <label className={labelClass}>Subtotal</label>
                            <div className="h-10 px-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                              <span className="text-slate-400">Total:</span>
                              <span className="font-black text-indigo-700">
                                ₹{(Number(split.qty || 0) * Number(split.rate || 0)).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {split.destination_type === "branch" && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2">
                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                            <p className="text-[11px] font-medium text-emerald-900">
                              Delivering <span className="font-bold">{split.qty || 0} units</span> to{" "}
                              <span className="font-bold">{split.target_name || "Office"}</span> will automatically add this quantity into that branch's live stock inventory!
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* "+ Add Another Customer / Branch" button */}
                    <button
                      type="button"
                      onClick={handleAddAnotherCustomer}
                      className="w-full h-11 border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-50 rounded-xl text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Plus size={16} />
                      <span>+ Add Another Customer / Branch</span>
                    </button>
                  </div>
                )}

                {!editData && !cursorMode && (
                  <button
                    ref={addMaterialButtonRef}
                    type="button"
                    onClick={addMaterialRow}
                    onKeyDown={(e) => {
                      if (isEnterKey(e)) {
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {cursorMode ? "Customer Payable (Selling Price)" : "Order Subtotal & Charges"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-slate-900 tabular-nums">
                    ₹{finalTotal.toLocaleString("en-IN")}
                  </h2>
                  <span className="text-xs text-slate-400 font-semibold">
                    {cursorMode ? "Customer Ledger" : "Net Total"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {cursorMode ? "Total Qty" : "Items"}
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      {cursorMode
                        ? `${totalDispatchedQty.toLocaleString()} units`
                        : entryMode === "today"
                        ? materials.filter((m) => m.material_id).length
                        : parsedLedger?.orders.length || 0}
                    </p>
                  </div>

                  {cursorMode && totalCalculatedProfit !== 0 && (
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        totalCalculatedProfit >= 0
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border-rose-200 text-rose-800"
                      }`}
                    >
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                          Calculated Profit
                        </p>
                        <p className="text-xs font-black">
                          ₹{totalCalculatedProfit.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}

                  {cursorMode && branchDeliveriesTotal > 0 && (
                    <div className="px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                      <p className="text-[9px] font-bold uppercase tracking-wider opacity-75">
                        Branch Stock Value
                      </p>
                      <p className="text-xs font-black">
                        ₹{branchDeliveriesTotal.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}

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
                          onFocus={(e) => {
                            try {
                              e.target.select();
                            } catch (_) {}
                          }}
                          onKeyDown={(e) => {
                            if (isEnterKey(e)) {
                              e.preventDefault();
                              safeFocus(submitButtonRef.current);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {loaderSalaryTotal > 0 && (
                    <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">
                        {cursorMode ? "Unload Total" : "Loader Total"}
                      </p>
                      <p className="text-xs font-bold text-emerald-700">₹{loaderSalaryTotal.toLocaleString()}</p>
                    </div>
                  )}
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
                    if (isEnterKey(e)) {
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
                      if (isEnterKey(e)) {
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
