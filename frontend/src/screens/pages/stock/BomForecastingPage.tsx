import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
  Package,
  Sparkles,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Tv,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchBomDepletion } from "../../../api/bi";
import type { BomRecipe, RawMaterialStock } from "../../../api/bi";

export default function BomForecastingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [recipes, setRecipes] = useState<BomRecipe[]>([]);
  const [rawStock, setRawStock] = useState<RawMaterialStock[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Simulator State
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [simulationQty, setSimulationQty] = useState<number>(2000);
  const [autoDeductionEnabled, setAutoDeductionEnabled] = useState<boolean>(true);
  const [simulationNotification, setSimulationNotification] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBomDepletion();
      if (res && res.success) {
        setRecipes(res.recipes);
        setRawStock(res.rawMaterialsStock);
        if (res.recipes.length > 0 && !selectedProductId) {
          setSelectedProductId(res.recipes[0].productId);
        }
      }
    } catch (err) {
      console.error("Failed to fetch BOM data", err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.productId === selectedProductId) || recipes[0];
  }, [recipes, selectedProductId]);

  // Calculations for simulated batch
  const batchRatio = simulationQty / (activeRecipe?.baseUnits || 1000);

  const simulatedMaterials = useMemo(() => {
    if (!activeRecipe || !activeRecipe.materials) return [];
    return activeRecipe.materials.map((m) => {
      const needed = +(m.quantity * batchRatio).toFixed(1);
      return {
        name: m.name,
        quantity: needed,
        unit: m.unit,
      };
    });
  }, [activeRecipe, batchRatio]);

  // Find critical materials
  const criticalItems = useMemo(() => {
    return rawStock.filter((s) => s.severity === "danger" || s.daysRemaining <= 3);
  }, [rawStock]);

  const handleSimulateDeduction = () => {
    const summary = simulatedMaterials.map((m) => `${m.quantity} ${m.unit} of ${m.name}`).join(", ");
    setSimulationNotification(
      `✓ Auto-Deduction Verified: Producing ${simulationQty.toLocaleString()} units of "${activeRecipe?.productName}" will deduct ${summary} from physical stock.`
    );
    setTimeout(() => {
      setSimulationNotification(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
              BOM & Inventory Intelligence
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Synced: {lastRefreshed || "Just now"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Layers className="text-indigo-600 size-7" />
            Automated Raw Material BOM & Depletion
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Real-time aggregate consumption formulas, auto-deduction engines & predictive replenishment depletion days.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/kiosk")}
            className="h-10 px-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Tv size={15} className="text-amber-400" />
            <span>TV Kiosk Mode</span>
          </button>
          <button
            onClick={() => navigate("/bi-analytics")}
            className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <Zap size={15} />
            <span>Executive BI & P&L</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="h-10 w-10 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Banner if any */}
      {criticalItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-300 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Depletion Warning
                </span>
                <span className="text-xs font-black text-slate-900">
                  {criticalItems.length} Raw Materials Critically Low
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {criticalItems.map((c) => `${c.name} has only ${c.daysRemaining} days left (${c.currentStock} ${c.unit})`).join(" • ")}. Re-order recommended immediately to prevent plant shutdown.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/shop/materials")}
            className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>Procure Materials</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Auto-deduction banner notification */}
      <AnimatePresence>
        {simulationNotification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-3 shadow-2xs"
          >
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{simulationNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: SIMULATION & AUTO-DEDUCTION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Production Batch Simulator */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <Calculator size={18} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Production Auto-Deduction Simulator</h2>
                <p className="text-xs font-semibold text-slate-400">
                  Simulate raw material formula ratios before dispatching to plant mixers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500 cursor-pointer select-none">
                Auto-Deduction:
              </label>
              <button
                type="button"
                onClick={() => setAutoDeductionEnabled(!autoDeductionEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoDeductionEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    autoDeductionEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Product Selector Pills */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Finished Product Formula
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {recipes.map((recipe) => (
                <button
                  key={recipe.productId}
                  type="button"
                  onClick={() => setSelectedProductId(recipe.productId)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedProductId === recipe.productId
                      ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <p className="text-xs font-black text-slate-900 truncate">{recipe.productName}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Base: {recipe.baseUnits} units</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Slider & Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Batch Production Volume (Bricks)
              </label>
              <div className="flex items-center gap-1.5">
                {[1000, 2000, 3500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSimulationQty(preset)}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border cursor-pointer transition-all ${
                      simulationQty === preset
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="500"
                max="10000"
                step="250"
                value={simulationQty}
                onChange={(e) => setSimulationQty(Number(e.target.value))}
                className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="w-28 shrink-0">
                <input
                  type="number"
                  min="100"
                  max="50000"
                  value={simulationQty}
                  onChange={(e) => setSimulationQty(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 text-sm font-black text-center text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Simulated Auto-Deduction Results */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Required Raw Materials for {simulationQty.toLocaleString()} bricks
              </span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                Formula: {activeRecipe?.productName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {simulatedMaterials.map((mat, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Package size={14} className="text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{mat.name}</span>
                  </div>
                  <p className="text-base font-black text-slate-900">
                    {mat.quantity}{" "}
                    <span className="text-xs font-semibold text-slate-500">{mat.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <p className="text-[11px] font-semibold text-indigo-900">
                Auto-deduction verifies inventory availability before sending batch commands to yard operators.
              </p>

              <button
                type="button"
                onClick={handleSimulateDeduction}
                className="w-full sm:w-auto h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Verify Auto-Deduction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Predictive Depletion Countdown Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Stock Depletion Forecasting</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Burn Rate Depletion Projection
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rawStock.map((item) => {
                const isCrit = item.severity === "danger" || item.daysRemaining <= 3;
                const isLow = item.severity === "warning" || (item.daysRemaining > 3 && item.daysRemaining <= 7);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCrit
                        ? "bg-rose-50/40 border-rose-200"
                        : isLow
                        ? "bg-amber-50/40 border-amber-200"
                        : "bg-slate-50/70 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{item.name}</span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isCrit
                                ? "bg-rose-100 text-rose-700"
                                : isLow
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 mt-1">
                          Current: <span className="text-slate-900 font-black">{item.currentStock.toLocaleString()} {item.unit}</span> • Burn: <span className="text-slate-700">{item.dailyBurnRate} {item.unit}/day</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-lg font-black ${
                            isCrit ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {item.daysRemaining}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block -mt-1">days left</span>
                      </div>
                    </div>

                    {/* Progress Bar of depletion */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full ${
                          isCrit ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, (item.daysRemaining / 15) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate("/shop/materials")}
              className="w-full h-10 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck size={14} />
              <span>Purchase Inbound Aggregate Loads</span>
            </button>
          </div>

          {/* Policy Information Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-950">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Standard Enterprise BOM Rule</span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
              When production entries are confirmed in <span className="font-bold text-indigo-900">Stock & Production</span>, the exact ratio of raw cement bags, aggregates, and stone dust are dynamically deducted from physical yard inventory, preventing manual double-entry discrepancies.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: PRODUCT RECIPES & MASTER RATIO TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">Standard BOM Master Ratio Table</h3>
            <p className="text-xs font-semibold text-slate-400">
              Approved formulas required to produce standard batches of finished concrete masonry
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
            {recipes.length} Active Master Recipes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Base Volume</th>
                <th className="py-3 px-3">Material Formula Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((r) => (
                <tr key={r.productId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-black text-slate-900">{r.productName}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-500">{r.baseUnits.toLocaleString()} units</td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-2">
                      {r.materials.map((m, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {m.name}: <span className="text-indigo-700">{m.quantity} {m.unit}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
