import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Search,
  CreditCard,
  Download,
  Pencil,
  Trash2,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  X,
  FileText,
  Phone,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { BASE_URL } from "../../../api/base";
import {
  type CursorItem,
  fetchCursorById,
  updateCursor,
  addCursorProduct,
  deleteCursorProduct,
  createCursorLoad,
  createCursorPayment,
  deleteCursorPayment,
} from "../../../api/cursor";
import { fetchVehicles } from "../../../api/vehicle";
import { getEmployees } from "../../../api/inventory";

export default function CursorLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cursor, setCursor] = useState<CursorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "LOADS" | "PAYMENTS" | "PRODUCTS">("ALL");

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // External data
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  // Form states
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    location: "",
    notes: "",
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    bank_id: "",
    payment_mode: "BANK TRANSFER",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [productFormData, setProductFormData] = useState({
    product_name: "",
    category: "sand" as "sand" | "cement" | "brick",
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const [loadingFormData, setLoadingFormData] = useState({
    cursor_product_id: "",
    product_name: "",
    category: "sand",
    vehicle_id: "",
    vehicle_number: "",
    driver_id: "",
    driver_name: "",
    qty: "",
    price_per_qty: "",
    has_loading_charge: false,
    loading_charge_per_unit: "",
    customer_name: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submittingLoading, setSubmittingLoading] = useState(false);

  // Export Date Range
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // 1. Load Cursor Details
  const loadCursorData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchCursorById(id);
      if (res.success && res.data) {
        setCursor(res.data);
        setEditFormData({
          name: res.data.name || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
          notes: res.data.notes || "",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load cursor ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCursorData();
    Promise.all([
      fetchVehicles().catch(() => []),
      getEmployees().catch(() => ({ data: [] })),
      fetch(`${BASE_URL}/banks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ]).then(([vList, eList, bList]) => {
      setVehicles(vList || []);
      setEmployees(eList.data || []);
      if (bList && bList.success) setBanks(bList.data || []);
    });
  }, [id]);

  // Derived financials
  const loads = useMemo(() => cursor?.loads || [], [cursor]);
  const payments = useMemo(() => cursor?.payments || [], [cursor]);
  const products = useMemo(() => cursor?.products || [], [cursor]);

  const totalProcurementAmount = useMemo(() => {
    if (cursor?.totalProcurementAmount !== undefined) return cursor.totalProcurementAmount;
    return loads.reduce((sum, l) => {
      const itemTotal = Number(l.qty || 0) * Number(l.price_per_qty || 0);
      const charge = l.has_loading_charge
        ? Number(l.qty || 0) * Number(l.loading_charge_per_unit || 0)
        : 0;
      return sum + itemTotal + charge;
    }, 0);
  }, [loads, cursor]);

  const totalPaidAmount = useMemo(() => {
    if (cursor?.totalPaidAmount !== undefined) return cursor.totalPaidAmount;
    return payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments, cursor]);

  const balance = useMemo(() => {
    if (cursor?.balance !== undefined) return cursor.balance;
    return totalProcurementAmount - totalPaidAmount;
  }, [totalProcurementAmount, totalPaidAmount, cursor]);

  const isSettled = balance <= 0;

  // Distinct category tags for cursor header
  const categoryTags = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.toLowerCase());
    });
    if (set.size === 0) set.add("quarry");
    return Array.from(set);
  }, [products]);

  // Unified Chronological Ledger Logs
  const allLogs = useMemo(() => {
    const list: any[] = [];

    // Add loads (Debits / Procurement)
    loads.forEach((l) => {
      const itemTotal = Number(l.qty || 0) * Number(l.price_per_qty || 0);
      const charge = l.has_loading_charge
        ? Number(l.qty || 0) * Number(l.loading_charge_per_unit || 0)
        : 0;
      const totalCost = itemTotal + charge;

      list.push({
        id: `load-${l.id}`,
        rawId: l.id,
        type: "LOAD",
        date: l.date,
        sortDate: new Date(l.date).getTime(),
        title: l.product_name,
        subtitle: `${l.vehicle_number} • Driver: ${l.driver_name}`,
        category: l.category,
        qty: Number(l.qty),
        rate: Number(l.price_per_qty),
        loadingCharge: charge,
        debit: totalCost, // Money we owe the cursor
        credit: 0,
        status: l.status,
        remainingQty: Number(l.remaining_qty),
        raw: l,
      });
    });

    // Add payments (Credits / Settlements)
    payments.forEach((p) => {
      list.push({
        id: `pay-${p.id}`,
        rawId: p.id,
        type: "PAYMENT",
        date: p.date,
        sortDate: new Date(p.date).getTime(),
        title: `Payment via ${p.payment_mode}`,
        subtitle: p.bank ? `${p.bank.name} (${p.bank.accountNumber || "A/C"})` : (p.description || "Cash settlement"),
        category: "payment",
        qty: null,
        rate: null,
        loadingCharge: 0,
        debit: 0,
        credit: Number(p.amount), // Money paid to the cursor
        status: "completed",
        raw: p,
      });
    });

    // Sort ascending for running balance calculation
    list.sort((a, b) => a.sortDate - b.sortDate || a.rawId - b.rawId);

    let running = 0;
    list.forEach((item) => {
      running += item.debit - item.credit;
      item.runningBalance = running;
    });

    // Return in reverse chronological order for table view
    return list.slice().reverse();
  }, [loads, payments]);

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return allLogs;
    return allLogs.filter((item) => {
      return (
        item.title.toLowerCase().includes(term) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.status && item.status.toLowerCase().includes(term))
      );
    });
  }, [allLogs, searchTerm]);

  // Tab filtered items
  const tabFilteredLogs = useMemo(() => {
    if (activeTab === "ALL") return filteredLogs;
    if (activeTab === "LOADS") return filteredLogs.filter((l) => l.type === "LOAD");
    if (activeTab === "PAYMENTS") return filteredLogs.filter((l) => l.type === "PAYMENT");
    return [];
  }, [filteredLogs, activeTab]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  // Available modes for selected bank in payment modal
  const selectedBankData = useMemo(() => {
    return banks.find((b) => String(b.id) === paymentFormData.bank_id);
  }, [banks, paymentFormData.bank_id]);

  const availableModes = useMemo(() => {
    if (!selectedBankData) return ["CASH", "BANK TRANSFER", "GPAY", "PHONEPE", "CHEQUE", "UPI"];
    if (selectedBankData.name.toLowerCase() === "cash") return ["CASH"];
    const modes: string[] = [];
    if (selectedBankData.gpay) modes.push("GPAY");
    if (selectedBankData.phonepe) modes.push("PHONEPE");
    if (selectedBankData.bankTransfer) modes.push("BANK TRANSFER");
    if (modes.length === 0) return ["BANK TRANSFER", "CHEQUE", "UPI", "GPAY"];
    return modes;
  }, [selectedBankData]);

  /* ================= HANDLERS ================= */

  // 1. Edit Cursor
  const handleEditCursorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursor) return;
    if (!editFormData.name.trim()) {
      toast.error("Cursor name is required");
      return;
    }
    try {
      await updateCursor(cursor.id, editFormData);
      toast.success("Cursor details updated");
      setIsEditModalOpen(false);
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update cursor");
    }
  };

  // 2. Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursor) return;
    if (!productFormData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSubmittingProduct(true);
    try {
      await addCursorProduct(cursor.id, {
        product_name: productFormData.product_name.trim(),
        category: productFormData.category,
      });
      toast.success("Product added to cursor catalog!");
      setProductFormData({ product_name: "", category: "sand" });
      setIsProductModalOpen(false);
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProductClick = async (productId: number) => {
    if (!window.confirm("Remove this product from the cursor catalog?")) return;
    try {
      await deleteCursorProduct(productId);
      toast.success("Product removed");
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove product");
    }
  };

  // 3. Record Loading
  const handleOpenLoadingModal = () => {
    const firstProduct = products.length > 0 ? products[0] : null;
    setLoadingFormData({
      cursor_product_id: firstProduct ? String(firstProduct.id) : "",
      product_name: firstProduct ? firstProduct.product_name : "",
      category: firstProduct ? firstProduct.category : "sand",
      vehicle_id: "",
      vehicle_number: "",
      driver_id: "",
      driver_name: "",
      qty: "",
      price_per_qty: "",
      has_loading_charge: false,
      loading_charge_per_unit: "",
      customer_name: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsLoadingModalOpen(true);
  };

  const handleLoadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursor) return;
    if (!loadingFormData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!loadingFormData.vehicle_number.trim()) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!loadingFormData.driver_name.trim()) {
      toast.error("Driver name is required");
      return;
    }
    if (!loadingFormData.qty || Number(loadingFormData.qty) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!loadingFormData.price_per_qty || Number(loadingFormData.price_per_qty) < 0) {
      toast.error("Please enter a valid purchase price per unit");
      return;
    }

    setSubmittingLoading(true);
    try {
      await createCursorLoad(cursor.id, {
        cursor_product_id: loadingFormData.cursor_product_id ? Number(loadingFormData.cursor_product_id) : null,
        product_name: loadingFormData.product_name.trim(),
        category: loadingFormData.category,
        vehicle_id: loadingFormData.vehicle_id ? Number(loadingFormData.vehicle_id) : null,
        vehicle_number: loadingFormData.vehicle_number.trim(),
        driver_id: loadingFormData.driver_id ? Number(loadingFormData.driver_id) : null,
        driver_name: loadingFormData.driver_name.trim(),
        qty: Number(loadingFormData.qty),
        price_per_qty: Number(loadingFormData.price_per_qty),
        has_loading_charge: loadingFormData.has_loading_charge,
        loading_charge_per_unit: loadingFormData.has_loading_charge ? Number(loadingFormData.loading_charge_per_unit || 0) : 0,
        customer_name: loadingFormData.customer_name ? loadingFormData.customer_name.trim() : null,
        date: loadingFormData.date,
        notes: loadingFormData.notes,
      });

      toast.success("Material load recorded with status 'loaded'!");
      setIsLoadingModalOpen(false);
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record loading");
    } finally {
      setSubmittingLoading(false);
    }
  };

  // 4. Record Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursor) return;
    if (!paymentFormData.amount || Number(paymentFormData.amount) <= 0) {
      toast.error("Valid payment amount is required");
      return;
    }

    setSubmittingPayment(true);
    try {
      await createCursorPayment(cursor.id, {
        amount: Number(paymentFormData.amount),
        bank_id: paymentFormData.bank_id ? Number(paymentFormData.bank_id) : null,
        payment_mode: paymentFormData.payment_mode,
        date: paymentFormData.date,
        description: paymentFormData.description,
      });

      toast.success("Payment recorded successfully!");
      setIsPaymentModalOpen(false);
      setPaymentFormData({
        amount: "",
        bank_id: "",
        payment_mode: "BANK TRANSFER",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePaymentClick = async (paymentId: number) => {
    if (!window.confirm("Delete this payment record and restore bank account balance?")) return;
    try {
      await deleteCursorPayment(paymentId);
      toast.success("Payment removed and balance restored");
      await loadCursorData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete payment");
    }
  };

  // 5. PDF Statement Export
  const handleExportStatementPdf = () => {
    if (!cursor) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({ compress: true });
      const pageWidth = doc.internal.pageSize.width;

      // Header branding bar
      doc.setFillColor(30, 41, 59); // Slate-900
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("ASWATH HOLLOW BRICKS", 14, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text("Quarry Procurement & Material Settlement Ledger", 14, 32);

      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.text("CURSOR QUARRY PROCUREMENT STATEMENT", pageWidth / 2, 54, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      if (exportStartDate && exportEndDate) {
        doc.text(
          `Period: ${new Date(exportStartDate).toLocaleDateString()} to ${new Date(exportEndDate).toLocaleDateString()}`,
          pageWidth / 2,
          61,
          { align: "center" }
        );
      } else {
        doc.text("Complete Transaction History", pageWidth / 2, 61, { align: "center" });
      }

      // Cursor Info Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      (doc as any).roundedRect(14, 72, pageWidth - 28, 28, 3, 3, "FD");

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.text("Quarry Vendor Detail", 20, 80);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text(cursor.name, 20, 87);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Phone: ${cursor.phone || "N/A"} • Location: ${cursor.location || "N/A"}`, 20, 94);

      // Financials Summary on Right
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text("Ledger Standing", pageWidth - 85, 80);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Outstanding Due:", pageWidth - 85, 87);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(balance > 0 ? 220 : 16, balance > 0 ? 38 : 149, balance > 0 ? 38 : 106);
      doc.text(`Rs. ${balance.toLocaleString("en-IN")}`, pageWidth - 20, 87, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Generated On:", pageWidth - 85, 94);
      doc.text(new Date().toLocaleDateString(), pageWidth - 20, 94, { align: "right" });

      // Filter rows by date
      const startTs = exportStartDate ? new Date(exportStartDate).getTime() : 0;
      const endTs = exportEndDate ? new Date(exportEndDate).getTime() : Infinity;

      const reportLogs = allLogs
        .filter((l) => l.sortDate >= startTs && l.sortDate <= endTs)
        .sort((a, b) => a.sortDate - b.sortDate);

      // Build Table Data
      const tableData = reportLogs.map((l, index) => [
        index + 1,
        new Date(l.date).toLocaleDateString(),
        l.type === "LOAD" ? "MATERIAL LOAD" : "PAYMENT SETTLEMENT",
        l.type === "LOAD" ? `${l.title} (${l.qty} units @ Rs.${l.rate})` : l.title,
        l.subtitle || "-",
        l.debit > 0 ? `Rs. ${l.debit.toLocaleString("en-IN")}` : "-",
        l.credit > 0 ? `Rs. ${l.credit.toLocaleString("en-IN")}` : "-",
        `Rs. ${l.runningBalance.toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        startY: 108,
        head: [["#", "Date", "Entry Type", "Particulars", "Reference / Fleet", "Debit (Purchased)", "Credit (Paid)", "Balance"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 28 },
          3: { cellWidth: 42 },
          4: { cellWidth: 32 },
          5: { cellWidth: 24, halign: "right", textColor: [220, 38, 38] },
          6: { cellWidth: 24, halign: "right", textColor: [16, 149, 106] },
          7: { cellWidth: 24, halign: "right", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [
          [
            "",
            "",
            "TOTALS",
            "",
            "",
            `Rs. ${totalProcurementAmount.toLocaleString("en-IN")}`,
            `Rs. ${totalPaidAmount.toLocaleString("en-IN")}`,
            `Rs. ${balance.toLocaleString("en-IN")}`,
          ],
        ],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          halign: "right",
        },
      });

      // Verification footer
      const finalY = (doc as any).lastAutoTable.finalY || 180;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Authorized Commercial Procurement Statement • M.Aswath Hollow Bricks & Transport",
        pageWidth / 2,
        finalY + 16,
        { align: "center" }
      );

      doc.save(`Statement_${cursor.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Statement exported successfully!");
      setIsExportModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to export PDF statement");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading Cursor Ledger...</span>
      </div>
    );
  }

  if (!cursor) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Cursor Not Found</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          The requested quarry vendor record could not be loaded.
        </p>
        <button
          onClick={() => navigate("/cursors")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700"
        >
          Return to Cursors
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ================= 1. HEADER SECTION (MATCHING TPK EXACTLY) ================= */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Building2 size={12} />
              CURSOR PROCUREMENT LEDGER • ID: #{cursor.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
              QUARRY / CRUSHER
            </span>
          </div>

          {/* Title Row with Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cursors")}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Back to Cursors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {cursor.name}
            </h1>
          </div>

          {/* Details Row: Phone, Location, Category pills */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            {cursor.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                <span>{cursor.phone}</span>
              </div>
            )}
            {cursor.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                <span>{cursor.location}</span>
              </div>
            )}
            {categoryTags.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-indigo-600 border border-slate-200/60"
              >
                #{cat}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons Top-Right (Matching TPK) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Pencil size={14} />
            <span>Edit Cursor</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard size={14} />
            <span>Record Payment</span>
          </button>

          <button
            onClick={handleOpenLoadingModal}
            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Loading</span>
          </button>

          <button
            onClick={() => setIsProductModalOpen(true)}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Package size={14} />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* ================= 2. SUMMARY CARDS ROW (MATCHING TPK EXACTLY) ================= */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: OUTSTANDING BALANCE */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Current Due Balance
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    isSettled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}
                >
                  {isSettled ? (
                    <>
                      <CheckCircle2 size={10} /> Fully Settled
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Pending Due
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                  ₹{Math.max(0, balance).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-slate-400">INR</span>
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isSettled ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Live reconciled ledger</span>
            </div>
            {!isSettled && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <CreditCard size={13} /> Settle Now
              </button>
            )}
          </div>
        </motion.div>

        {/* CARD 2: TURNOVER & VOLUME */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Cursor Turnover
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
                  ₹{totalProcurementAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-slate-400">Total</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers size={22} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Procurements
              </span>
              <span className="font-extrabold text-slate-700 text-xs">
                {loads.length} Loads
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Payments
              </span>
              <span className="font-extrabold text-emerald-600 text-xs">
                ₹{totalPaidAmount.toLocaleString("en-IN")} ({payments.length})
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: STATEMENT EXPORT (MATCHING TPK) */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xs flex flex-col justify-between relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
                <FileText size={12} className="text-indigo-400" /> Statement Export
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                PDF & CSV
              </span>
            </div>
            <h3 className="text-base font-extrabold tracking-tight mt-1">Official Cursor Statement</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              Generate and download itemized tax invoices & ledger settlement sheets.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 relative z-10">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="w-full h-10 rounded-xl bg-white text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            >
              <Download size={14} />
              <span>Generate & Download Statement</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* ================= 3. TABS & SEARCH BAR ================= */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Records ({allLogs.length})
            </button>
            <button
              onClick={() => setActiveTab("LOADS")}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "LOADS"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Loads / Procurements ({loads.length})
            </button>
            <button
              onClick={() => setActiveTab("PAYMENTS")}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "PAYMENTS"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab("PRODUCTS")}
              className={`h-9 px-4 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "PRODUCTS"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Products Catalog ({products.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by material, mode, bank..."
              className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-slate-100 border-none text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* ================= 4. TAB CONTENTS ================= */}

        {/* VIEW 1 & 2 & 3: ALL / LOADS / PAYMENTS TABLE */}
        {activeTab !== "PRODUCTS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {tabFilteredLogs.length === 0 ? (
              <div className="py-20 text-center">
                <Receipt size={40} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  No records match the current filter criteria for this cursor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Date</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Particulars</th>
                      <th className="py-3.5 px-4">Reference / Fleet</th>
                      <th className="py-3.5 px-4 text-right">Debit (Purchased)</th>
                      <th className="py-3.5 px-4 text-right">Credit (Paid)</th>
                      <th className="py-3.5 px-4 text-right">Balance</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {tabFilteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 whitespace-nowrap font-bold text-slate-900">
                          {new Date(log.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {log.type === "LOAD" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Truck size={10} /> Load
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CreditCard size={10} /> Payment
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {log.title}
                          {log.qty && (
                            <span className="block text-[11px] font-normal text-slate-500">
                              {log.qty} units @ ₹{log.rate}/unit
                              {log.loadingCharge > 0 && ` (+₹${log.loadingCharge} loading)`}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {log.subtitle}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-rose-600 whitespace-nowrap">
                          {log.debit > 0 ? `₹${log.debit.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 whitespace-nowrap">
                          {log.credit > 0 ? `₹${log.credit.toLocaleString("en-IN")}` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                          ₹{Number(log.runningBalance || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {log.type === "LOAD" ? (
                            log.status === "loaded" && log.remainingQty > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/customer/add-material/new", {
                                    state: { cursorLoadId: log.rawId },
                                  })
                                }
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Dispatch ({log.remainingQty} left)
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">Delivered</span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentClick(log.rawId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete payment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: PRODUCTS CATALOG TAB (FIXING "PRODUCT IS NOT SHOWING") */}
        {activeTab === "PRODUCTS" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Materials Available at {cursor.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Products and quarry raw materials configured under this cursor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>+ Add Product</span>
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center">
                <Package size={40} className="mx-auto text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Products Added Yet</h4>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">
                  Add products like M-Sand, P-Sand, Cement, Blue Metal to enable loading.
                </p>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  + Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 mb-1.5">
                          #{p.category}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">
                          {p.product_name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteProductClick(p.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Configured</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLoadingFormData((prev) => ({
                            ...prev,
                            cursor_product_id: String(p.id),
                            product_name: p.product_name,
                            category: p.category,
                          }));
                          setIsLoadingModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                      >
                        + Load This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL 1: RECORD PAYMENT (MATCHING TPK) ================= */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Record Payment</h3>
                    <p className="text-xs text-slate-500">To {cursor.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-4">
                {/* Outstanding Hint */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500">Current Outstanding Due:</span>
                  <span className="font-black text-rose-600">
                    ₹{Math.max(0, balance).toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Payment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount..."
                    value={paymentFormData.amount}
                    onChange={(e) =>
                      setPaymentFormData((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Select Bank / Cash Account
                  </label>
                  <select
                    value={paymentFormData.bank_id}
                    onChange={(e) =>
                      setPaymentFormData((prev) => ({ ...prev, bank_id: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Cash / Direct Payment</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} (Balance: ₹{Number(b.amount || 0).toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentFormData.payment_mode}
                    onChange={(e) =>
                      setPaymentFormData((prev) => ({ ...prev, payment_mode: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {availableModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.date}
                    onChange={(e) =>
                      setPaymentFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Reference / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Cheque No / Notes..."
                    value={paymentFormData.description}
                    onChange={(e) =>
                      setPaymentFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
                  >
                    {submittingPayment ? "Recording..." : "Save Payment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: STATEMENT EXPORT (MATCHING TPK) ================= */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Export Statement</h3>
                    <p className="text-xs text-slate-500">Official PDF for {cursor.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Leave dates blank to generate statement for the entire recorded history.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportStatementPdf}
                  disabled={isExporting}
                  className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{isExporting ? "Generating..." : "Download PDF"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 3: ADD PRODUCT ================= */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Add Product</h3>
                    <p className="text-xs text-slate-500">Product Name & Category alone</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M-Sand, P-Sand, 20mm Blue Metal, Cement"
                    value={productFormData.product_name}
                    onChange={(e) =>
                      setProductFormData((prev) => ({ ...prev, product_name: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={productFormData.category}
                    onChange={(e: any) =>
                      setProductFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  >
                    <option value="sand">Sand (M-Sand, P-Sand, River Sand)</option>
                    <option value="cement">Cement</option>
                    <option value="brick">Brick / Hollow Bricks</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                  >
                    {submittingProduct ? "Adding..." : "Save Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 4: RECORD LOADING ================= */}
      <AnimatePresence>
        {isLoadingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Record Vehicle Loading</h3>
                    <p className="text-xs text-slate-500">At {cursor.name} (Status: Loaded)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoadingModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleLoadingSubmit} className="space-y-4 pt-4">
                {/* Material Dropdown */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Select Material *
                  </label>
                  {products.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700">
                      No products added yet under this cursor.{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoadingModalOpen(false);
                          setIsProductModalOpen(true);
                        }}
                        className="font-bold underline ml-1 cursor-pointer"
                      >
                        + Add a product first
                      </button>
                    </div>
                  ) : (
                    <select
                      value={loadingFormData.cursor_product_id}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const prod = products.find((p) => String(p.id) === pid);
                        setLoadingFormData((prev) => ({
                          ...prev,
                          cursor_product_id: pid,
                          product_name: prod ? prod.product_name : "",
                          category: prod ? prod.category : "sand",
                        }));
                      }}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="">-- Choose Material --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} ({p.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Vehicle Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Pick Vehicle (Fleet)
                    </label>
                    <select
                      value={loadingFormData.vehicle_id}
                      onChange={(e) => {
                        const vid = e.target.value;
                        const v = vehicles.find((item) => String(item.id) === vid);
                        setLoadingFormData((prev) => ({
                          ...prev,
                          vehicle_id: vid,
                          vehicle_number: v ? v.vehicleNumber : prev.vehicle_number,
                        }));
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="">-- Pick Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.vehicleName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TN 38 AB 1234"
                      value={loadingFormData.vehicle_number}
                      onChange={(e) =>
                        setLoadingFormData((prev) => ({
                          ...prev,
                          vehicle_number: e.target.value.toUpperCase(),
                        }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Driver Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Pick Driver (Staff)
                    </label>
                    <select
                      value={loadingFormData.driver_id}
                      onChange={(e) => {
                        const did = e.target.value;
                        const d = employees.find((emp) => String(emp.employee_id) === did);
                        setLoadingFormData((prev) => ({
                          ...prev,
                          driver_id: did,
                          driver_name: d ? d.employee_name : prev.driver_name,
                        }));
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      <option value="">-- Pick Driver --</option>
                      {employees.map((emp) => (
                        <option key={emp.employee_id} value={emp.employee_id}>
                          {emp.employee_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Driver Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Driver Name..."
                      value={loadingFormData.driver_name}
                      onChange={(e) =>
                        setLoadingFormData((prev) => ({
                          ...prev,
                          driver_name: e.target.value,
                        }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Qty & Buy Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Quantity (Units / Bags) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 50"
                      value={loadingFormData.qty}
                      onChange={(e) =>
                        setLoadingFormData((prev) => ({ ...prev, qty: e.target.value }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                      Buy Price / Qty (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 400"
                      value={loadingFormData.price_per_qty}
                      onChange={(e) =>
                        setLoadingFormData((prev) => ({
                          ...prev,
                          price_per_qty: e.target.value,
                        }))
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Optional Loading Charge */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loadingFormData.has_loading_charge}
                      onChange={(e) =>
                        setLoadingFormData((prev) => ({
                          ...prev,
                          has_loading_charge: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-extrabold text-slate-700">
                      Optional Loading Charge (Paid at Quarry)
                    </span>
                  </label>

                  {loadingFormData.has_loading_charge && (
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                        Loading Charge Per Unit (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 5"
                        value={loadingFormData.loading_charge_per_unit}
                        onChange={(e) =>
                          setLoadingFormData((prev) => ({
                            ...prev,
                            loading_charge_per_unit: e.target.value,
                          }))
                        }
                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                      />
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Loading Date
                  </label>
                  <input
                    type="date"
                    required
                    value={loadingFormData.date}
                    onChange={(e) =>
                      setLoadingFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>

                {/* Total Price Banner (Live Calculation) */}
                {(() => {
                  const qtyVal = Number(loadingFormData.qty) || 0;
                  const priceVal = Number(loadingFormData.price_per_qty) || 0;
                  const loadChargeVal = loadingFormData.has_loading_charge
                    ? Number(loadingFormData.loading_charge_per_unit) || 0
                    : 0;
                  const baseCost = qtyVal * priceVal;
                  const totalLoadingCharge = qtyVal * loadChargeVal;
                  const totalPrice = baseCost + totalLoadingCharge;

                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/40 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-0.5">
                          Total Price
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">
                          {qtyVal > 0 && priceVal > 0 ? (
                            <>
                              {qtyVal} × ₹{priceVal.toLocaleString("en-IN")} = ₹{baseCost.toLocaleString("en-IN")}
                              {totalLoadingCharge > 0 && (
                                <span className="text-amber-300 font-medium ml-1">
                                  (+₹{totalLoadingCharge.toLocaleString("en-IN")} load)
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400">Enter quantity & buy price</span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
                            ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">INR</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                          Total Amount
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLoadingModalOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLoading}
                    className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                  >
                    {submittingLoading ? "Recording Load..." : "Confirm & Save Load"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 5: EDIT CURSOR ================= */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Pencil size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Edit Cursor</h3>
                    <p className="text-xs text-slate-500">Update quarry vendor details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditCursorSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Cursor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
