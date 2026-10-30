import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  X,
  Save,
  Users,
  HardHat,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Coins,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";
import toast from "react-hot-toast";
import { getRecipeEstimate } from "../../../api/inventory";
import { useStockStore } from "../../../store/useStockStore";

interface ProductionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProductionEntryModal({
  isOpen,
  onClose,
  onSuccess
}: ProductionEntryModalProps) {
  const { stock: products, offices, employees: staffList, logProduction, fetchStockData } = useStockStore();

  const [submitting, setSubmitting] = useState(false);
  const [productionForm, setProductionForm] = useState({
    shopId: "",
    productId: "",
    cementProductId: "",
    cementBags: "",
    number_of_stocks: "",
    bricks_per_stock: "",
    price_per_stock: "",
    date: new Date().toISOString().split("T")[0],
    selectedStaffIds: [] as number[],
  });

  const [recipeEstimate, setRecipeEstimate] = useState<any>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProductionForm({
        shopId: offices.length === 1 ? String(offices[0].office_id) : "",
        productId: "",
        cementProductId: "",
        cementBags: "",
        number_of_stocks: "",
        bricks_per_stock: "",
        price_per_stock: "",
        date: new Date().toISOString().split("T")[0],
        selectedStaffIds: [],
      });
      setRecipeEstimate(null);
    }
  }, [isOpen, offices]);

  // Finished brick products for the chosen shop
  const productionProducts = useMemo(() => {
    return products.filter((p) => p.office_id === Number(productionForm.shopId));
  }, [productionForm.shopId, products]);

  // Cement products for the chosen shop
  const cementProducts = useMemo(() => {
    return products
      .filter((p) => p.office_id === Number(productionForm.shopId) && p.product.category === "cement")
      .map((p) => ({
        product_id: p.product_id,
        product_name: p.product.product_name,
        available_qty: parseFloat(p.quantity) || 0
      }));
  }, [productionForm.shopId, products]);

  // Selected Material product
  const selectedProduct = useMemo(() => {
    return products.find(p => p.product_id === Number(productionForm.productId) && p.office_id === Number(productionForm.shopId));
  }, [productionForm.productId, productionForm.shopId, products]);

  // Selected Cement product
  const selectedCement = useMemo(() => {
    return cementProducts.find(p => p.product_id === Number(productionForm.cementProductId));
  }, [productionForm.cementProductId, cementProducts]);

  // Calculated numbers
  const numStocks = parseFloat(productionForm.number_of_stocks) || 0;
  const numBricksPerStock = parseFloat(productionForm.bricks_per_stock) || 0;
  const pricePerStock = parseFloat(productionForm.price_per_stock) || 0;

  // Auto-calculated total bricks = Stocks * Bricks per Stock
  const totalBricks = numStocks > 0 && numBricksPerStock > 0
    ? Math.round(numStocks * numBricksPerStock)
    : (numStocks > 0 ? numStocks : 0);

  // Total wage = Stocks * Price Per Stock
  const totalWageAmount = numStocks * pricePerStock;
  const staffCount = productionForm.selectedStaffIds.length;
  // Separate equally among assigned staff
  const perStaffWage = staffCount > 0 ? (totalWageAmount / staffCount) : 0;

  // Staff Assignment handlers
  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !productionForm.selectedStaffIds.includes(id)) {
      setProductionForm((prev) => ({
        ...prev,
        selectedStaffIds: [...prev.selectedStaffIds, id],
      }));
    }
  };

  const removeStaff = (id: number) => {
    setProductionForm((prev) => ({
      ...prev,
      selectedStaffIds: prev.selectedStaffIds.filter((s) => s !== id),
    }));
  };

  // Fetch recipe estimate when shop, product, or totalBricks changes
  useEffect(() => {
    if (productionForm.shopId && productionForm.productId && totalBricks > 0) {
      getRecipeEstimate(productionForm.shopId, productionForm.productId, String(totalBricks))
        .then((res) => {
          if (res && res.success && res.has_recipe) {
            setRecipeEstimate(res);
            if (!productionForm.cementBags && res.cement_estimate !== null) {
              setProductionForm((prev) => ({ ...prev, cementBags: String(res.cement_estimate) }));
            }
          } else {
            setRecipeEstimate(null);
          }
        })
        .catch(() => setRecipeEstimate(null));
    } else {
      setRecipeEstimate(null);
    }
  }, [productionForm.shopId, productionForm.productId, totalBricks]);

  // Cement Variance Status
  const cementVariance = useMemo(() => {
    if (!recipeEstimate || recipeEstimate.cement_estimate === null || !productionForm.cementBags) return null;
    const expected = parseFloat(recipeEstimate.cement_estimate);
    const actual = parseFloat(productionForm.cementBags);
    if (isNaN(expected) || isNaN(actual) || expected === 0) return null;

    const diff = parseFloat((actual - expected).toFixed(2));
    const pct = parseFloat(((diff / expected) * 100).toFixed(1));
    const threshold = expected * 0.05;

    let status: "OPTIMAL" | "HIGH" | "LOW" = "OPTIMAL";
    if (diff > threshold) status = "HIGH";
    else if (diff < -threshold) status = "LOW";

    return { diff, pct, expected, actual, status };
  }, [recipeEstimate, productionForm.cementBags]);

  // Form Submission
  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productionForm.selectedStaffIds.length === 0) {
      toast.error("Please assign at least one staff member.");
      return;
    }

    if (numStocks <= 0) {
      toast.error("Please enter a valid Number of Stocks.");
      return;
    }

    if (numBricksPerStock <= 0) {
      toast.error("Please enter Number of Bricks per Stock.");
      return;
    }

    if (pricePerStock < 0) {
      toast.error("Price per stock cannot be negative.");
      return;
    }

    if (totalBricks <= 0) {
      toast.error("Total bricks calculated must be greater than zero.");
      return;
    }

    const cementBagsNum = parseFloat(productionForm.cementBags || "0");
    if (isNaN(cementBagsNum) || cementBagsNum < 0) {
      toast.error("Cement bags used cannot be negative.");
      return;
    }

    // Pre-check cement availability
    if (productionForm.cementProductId && cementBagsNum > 0) {
      const cementInStock = products.find(
        (p) =>
          p.product_id === Number(productionForm.cementProductId) &&
          p.office_id === Number(productionForm.shopId)
      );
      const available = cementInStock ? parseFloat(cementInStock.quantity) : 0;
      if (cementBagsNum > available) {
        toast.error(`Insufficient cement stock! Available: ${available} Bags`);
        return;
      }
    }

    const payload = {
      office_id: Number(productionForm.shopId),
      product_id: Number(productionForm.productId),
      unit_produced: totalBricks,
      cement_used: cementBagsNum,
      cement_product_id: productionForm.cementProductId ? Number(productionForm.cementProductId) : undefined,
      production_date: productionForm.date,
      employee_ids: productionForm.selectedStaffIds,
      number_of_stocks: numStocks,
      price_per_stock: pricePerStock,
    };

    try {
      setSubmitting(true);
      await logProduction(payload);
      await fetchStockData(true);
      toast.success("Production logged! Finished stock added & cement deducted.");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to log production.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10"
        >
          {/* 1. FIXED HEADER */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                <CalendarDays size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Production <span className="text-indigo-600">Entry</span>
                </h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Daily manufacturing & piece-rate wage entry
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. FORM & SCROLLABLE CONTENT */}
          <form onSubmit={handleProductionSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {/* Row 1: Production Date & Store */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    required
                    value={productionForm.date}
                    onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    1. Store / Plant Location
                  </label>
                  <select
                    required
                    value={productionForm.shopId}
                    onChange={(e) =>
                      setProductionForm({
                        ...productionForm,
                        shopId: e.target.value,
                        productId: "",
                        cementProductId: "",
                      })
                    }
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="">Select Plant Location</option>
                    {offices.map((shop) => (
                      <option key={shop.office_id} value={shop.office_id}>
                        {shop.office_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Brick Product to Manufacture & Cement Product */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    2. Brick Product to Manufacture
                  </label>
                  <select
                    required
                    disabled={!productionForm.shopId}
                    value={productionForm.productId}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const p = productionProducts.find((item) => item.product_id === Number(prodId));
                      const defaultPrice = (p?.product as any)?.price_per_stock
                        ? String((p?.product as any)?.price_per_stock)
                        : "";
                      setProductionForm((prev) => ({
                        ...prev,
                        productId: prodId,
                        price_per_stock: prev.price_per_stock || defaultPrice,
                      }));
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {productionForm.shopId ? "Choose Item" : "Select Store First"}
                    </option>
                    {productionProducts
                      .filter((p) => p.product.category === "bricks")
                      .map((p) => (
                        <option key={p.stock_id} value={p.product_id}>
                          {p.product.product_name} (Current: {p.quantity} Nos)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    3. Cement Type
                  </label>
                  <select
                    required
                    disabled={!productionForm.shopId}
                    value={productionForm.cementProductId}
                    onChange={(e) =>
                      setProductionForm({ ...productionForm, cementProductId: e.target.value })
                    }
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:opacity-50"
                  >
                    <option value="">
                      {productionForm.shopId ? "Select Cement" : "Select Store First"}
                    </option>
                    {cementProducts.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.product_name} ({p.available_qty} Bags in Stock)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Cement Bags Used & Assign Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    4. Cement Bags Used
                  </label>
                  <div className="relative">
                    <HardHat
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={15}
                    />
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      placeholder="Qty Used (Bags)"
                      value={productionForm.cementBags}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setProductionForm({ ...productionForm, cementBags: val });
                        }
                      }}
                      className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                    />
                  </div>

                  {/* Cement Variance Alert */}
                  {cementVariance && (
                    <div
                      className={`mt-2 p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                        cementVariance.status === "HIGH"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : cementVariance.status === "LOW"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {cementVariance.status === "HIGH" ? (
                        <>
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                          <span>
                            <strong>High Usage:</strong> +{cementVariance.diff} Bags ({cementVariance.pct}%) above formula ({cementVariance.expected} Bags).
                          </span>
                        </>
                      ) : cementVariance.status === "LOW" ? (
                        <>
                          <AlertCircle size={14} className="text-blue-600 shrink-0" />
                          <span>
                            <strong>Lean Mix:</strong> {cementVariance.diff} Bags ({cementVariance.pct}%) below formula ({cementVariance.expected} Bags).
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>
                            <strong>Optimal:</strong> Matches plant formula ({cementVariance.expected} Bags).
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    5. Assign Staff
                  </label>
                  <select
                    onChange={handleStaffSelect}
                    value=""
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value="">+ Add Staff Member</option>
                    {staffList.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.employee_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assigned Staff Pills (Names Only) */}
              <div>
                <div className="flex flex-wrap items-center gap-2 min-h-[42px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {productionForm.selectedStaffIds.length === 0 ? (
                    <span className="text-[11px] text-amber-600 font-bold p-1">
                      * Select at least one staff member for wage allocation
                    </span>
                  ) : (
                    productionForm.selectedStaffIds.map((id) => {
                      const staff = staffList.find((s) => s.employee_id === id);
                      return (
                        <span
                          key={id}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                        >
                          <Users size={12} className="text-indigo-600" />
                          <span>{staff?.employee_name}</span>
                          <button
                            type="button"
                            onClick={() => removeStaff(id)}
                            className="text-slate-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Row 4: Stocks Count, Bricks Per Stock & Price Per Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-500 h-6 flex items-center gap-1 mb-1 whitespace-nowrap">
                    <Boxes size={12} className="text-indigo-600 shrink-0" />
                    <span>6. No. of Stocks (Stacks)</span>
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 5"
                    value={productionForm.number_of_stocks}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*$/.test(val)) {
                        setProductionForm((prev) => ({ ...prev, number_of_stocks: val }));
                      }
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-500 h-6 flex items-center gap-1 mb-1 whitespace-nowrap">
                    <Boxes size={12} className="text-indigo-600 shrink-0" />
                    <span>7. Bricks per Stock</span>
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 50"
                    value={productionForm.bricks_per_stock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*$/.test(val)) {
                        setProductionForm((prev) => ({ ...prev, bricks_per_stock: val }));
                      }
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-500 h-6 flex items-center gap-1 mb-1 whitespace-nowrap">
                    <Coins size={12} className="text-emerald-600 shrink-0" />
                    <span>8. Price Per Stock (₹)</span>
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 20.00"
                    value={productionForm.price_per_stock}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setProductionForm((prev) => ({ ...prev, price_per_stock: val }));
                      }
                    }}
                    className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Production Calculation & Wage Split Summary */}
              {(totalBricks > 0 || totalWageAmount > 0) && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-50/60 to-emerald-50/40 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Total Finished Bricks Output
                      </span>
                      <span className="font-black text-slate-800 text-sm">
                        {totalBricks.toLocaleString("en-IN")}{" "}
                        <span className="text-xs font-bold text-indigo-600">Nos Produced</span>
                      </span>
                      {numStocks > 0 && numBricksPerStock > 0 && (
                        <span className="text-[11px] text-slate-500 font-semibold block">
                          ({numStocks} Stocks × {numBricksPerStock} Bricks/Stock)
                        </span>
                      )}
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Piece-Rate Labor Wages
                      </span>
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{totalWageAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {staffCount > 0 ? (
                        <span className="text-[11px] text-emerald-700 font-bold block">
                          ₹{perStaffWage.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each ({staffCount} assigned)
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium block">
                          (Assign staff above to split earnings)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Stock Impact Summary Box */}
              {(totalBricks > 0 || parseFloat(productionForm.cementBags) > 0) && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Inventory Stock Updates on Save:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {totalBricks > 0 && (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold">
                        <ArrowUpRight size={16} className="text-emerald-600 shrink-0" />
                        <div>
                          <span>+{totalBricks.toLocaleString("en-IN")} Bricks</span>
                          <span className="text-[10px] text-emerald-600 block font-normal">
                            Added to {selectedProduct?.product.product_name || "Finished Stock"}
                          </span>
                        </div>
                      </div>
                    )}
                    {parseFloat(productionForm.cementBags) > 0 && (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 font-bold">
                        <ArrowDownRight size={16} className="text-rose-600 shrink-0" />
                        <div>
                          <span>-{productionForm.cementBags} Bags</span>
                          <span className="text-[10px] text-rose-600 block font-normal">
                            Deducted from {selectedCement?.product_name || "Cement Stock"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. FIXED FOOTER */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Daily Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
