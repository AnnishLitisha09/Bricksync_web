import { useEffect, useState } from "react";
import {
  DollarSign,
  Fuel,
  Truck,
  AlertTriangle,
  ShieldAlert,
  Clock,
  RefreshCw,
  Tv,
  CheckCircle2,
  Activity,
  Calculator,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchBiOverview,
  type BiOverviewResponse,
} from "../../../api/bi";

export default function ExecutiveBiPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BiOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"unit_economics" | "fleet" | "aging">("unit_economics");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchBiOverview();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load BI data", err);
      setError(err.message || "Failed to load executive business intelligence data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in pb-12 font-sans select-none">
      {/* 1. Header Bar with TV Kiosk Launcher Shortcut */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
              C-Level Intelligence
            </span>
            <span className="text-xs font-semibold text-slate-400">Live P&L & Profitability</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Executive Business Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time unit economics, fleet cost-per-kilometer, and customer aging exposure
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadData}
            title="Refresh Intelligence Data"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
          <button
            onClick={() => navigate("/kiosk")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/20 cursor-pointer"
          >
            <Tv size={15} className="text-emerald-400" />
            <span>Launch Factory TV Kiosk</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top Executive Snapshot Metrics */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Selling Price vs Cost */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Avg. Selling Price</span>
              <DollarSign size={16} className="text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                ₹{data.unitEconomics.sellingPricePerBrick.toFixed(2)}
              </span>
              <span className="text-[11px] font-bold text-slate-400">/ brick</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Cost: ₹{data.unitEconomics.totalCostPerBrick.toFixed(2)}</span>
              <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                +{data.unitEconomics.marginPercent}% Margin
              </span>
            </div>
          </div>

          {/* Daily Break-Even Target */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Daily Break-Even Target</span>
              <Activity size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.breakEven.breakEvenTargetBricks.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-slate-400">bricks / day</span>
            </div>
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                <span>Progress: {data.breakEven.todayProduction} Bricks</span>
                <span>{data.breakEven.breakEvenProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data.breakEven.breakEvenProgress)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active Receivables & Overdue */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Total Outstanding Dues</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                ₹{data.customerAging.totalReceivables.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">90+ Days Exposure:</span>
              <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                ₹{data.customerAging.buckets[3]?.amount.toLocaleString("en-IN") || 0}
              </span>
            </div>
          </div>

          {/* Fleet Profitability & Efficiency */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>Active Fleet Efficiency</span>
              <Truck size={16} className="text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.fleetProfitability.length}
              </span>
              <span className="text-[11px] font-bold text-slate-400">commercial lorries</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Fuel Alerts:</span>
              {data.fleetProfitability.some((f) => f.pilferageRisk.includes("Alert")) ? (
                <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle size={11} /> Flagged
                </span>
              ) : (
                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  All Optimal
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Section Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-100/70 p-1 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("unit_economics")}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "unit_economics"
              ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calculator size={15} />
          <span>Unit Economics & P&L</span>
        </button>

        <button
          onClick={() => setActiveTab("fleet")}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "fleet"
              ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Truck size={15} />
          <span>Fleet Profitability & CPKM</span>
        </button>

        <button
          onClick={() => setActiveTab("aging")}
          className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "aging"
              ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert size={15} />
          <span>Customer Aging & Credit Lock</span>
        </button>
      </div>

      {/* 4. Tab 1: Real-Time Unit Economics & P&L */}
      {data && activeTab === "unit_economics" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in">
          {/* Cost Composition Waterfall */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Real-Time Cost per Brick vs. Selling Price
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Factorized live across raw materials, energy, loader wages, diesel & overheads
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Net Profit per Brick
                </span>
                <span className="text-xl font-black text-emerald-600">
                  +₹{data.unitEconomics.profitPerBrick.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Visual Cost Breakdown Stack */}
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">1. OPC 53 Grade Cement</span>
                  <span className="font-mono text-slate-900">₹{data.unitEconomics.cement.toFixed(2)} (41.6%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "41.6%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">2. Quarry Stone Dust & M-Sand</span>
                  <span className="font-mono text-slate-900">₹{data.unitEconomics.stoneDust.toFixed(2)} (26.0%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "26.0%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">3. Factory Electricity & Vibrator Power</span>
                  <span className="font-mono text-slate-900">₹{data.unitEconomics.electricity.toFixed(2)} (7.3%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "7.3%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">4. Loader & Production Labor Wages</span>
                  <span className="font-mono text-slate-900">₹{data.unitEconomics.loaderWages.toFixed(2)} (11.7%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "11.7%" }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">5. Diesel, Delivery & Driver Margin</span>
                  <span className="font-mono text-slate-900">₹{data.unitEconomics.dieselAndDelivery.toFixed(2)} (13.4%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: "13.4%" }} />
                </div>
              </div>
            </div>

            {/* Bottom Summary Callout */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                  P&L
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Gross Unit Margin: {data.unitEconomics.marginPercent}%
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Calculated against live dispatches and current raw procurement pricing
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Total Cost Base</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  ₹{data.unitEconomics.totalCostPerBrick.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Break-Even Gauge */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Daily Break-Even Gauge
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                  Daily Fixed: ₹28,500
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Production volume required each morning to cover factory fixed overheads
              </p>

              {/* Central Radial Progress Visual */}
              <div className="my-8 flex flex-col items-center justify-center">
                <div className="relative size-40 rounded-full bg-slate-50 border-8 border-slate-100 flex flex-col items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-indigo-600 border-t-transparent transition-all duration-700"
                    style={{ transform: `rotate(${data.breakEven.breakEvenProgress * 3.6}deg)` }}
                  />
                  <span className="text-3xl font-black text-slate-900">
                    {data.breakEven.breakEvenProgress}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                    Coverage
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-black text-slate-900">
                    {data.breakEven.todayProduction.toLocaleString()} / {data.breakEven.breakEvenTargetBricks.toLocaleString()} Bricks
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                    {data.breakEven.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-medium">
                <span>Fixed Factory Rent & Power Base</span>
                <span className="font-bold text-slate-800">₹14,500 / day</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Permanent Supervisors & Staff</span>
                <span className="font-bold text-slate-800">₹9,000 / day</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Machine Wear & EMI Depreciation</span>
                <span className="font-bold text-slate-800">₹5,000 / day</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Vehicle Fleet Profitability & CPKM */}
      {data && activeTab === "fleet" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6 animate-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Fleet Profitability, Cost Per KM (CPKM) & Pilferage Alerts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Revenue earned per lorry minus bunk diesel bills and garage repair costs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60 flex items-center gap-1.5">
                <Fuel size={14} /> Expected Mileage: 4.2 KM/L
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3">Vehicle Details</th>
                  <th className="py-3 px-3">Delivery Revenue</th>
                  <th className="py-3 px-3">Fuel & Service Cost</th>
                  <th className="py-3 px-3">Net Vehicle Profit</th>
                  <th className="py-3 px-3">Cost / KM (CPKM)</th>
                  <th className="py-3 px-3">Mileage (KM/L)</th>
                  <th className="py-3 px-3">Fuel Pilferage Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                {data.fleetProfitability.map((truck) => (
                  <tr key={truck.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          <Truck size={15} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase">{truck.vehicleNumber}</p>
                          <p className="text-[10px] text-slate-400">{truck.vehicleName}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      ₹{truck.revenue.toLocaleString("en-IN")}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono text-slate-600">
                        ₹{truck.totalOperatingCost.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Fuel: ₹{truck.fuelCost} • Svc: ₹{truck.serviceCost}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`font-mono font-black ${
                          truck.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {truck.netProfit >= 0 ? "+" : ""}₹{truck.netProfit.toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-700">
                      ₹{truck.cpkm.toFixed(2)} / km
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-slate-800">{truck.kmpl} KM/L</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          truck.pilferageRisk.includes("High Alert")
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : truck.pilferageRisk.includes("Moderate")
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {truck.pilferageRisk.includes("Alert") && <AlertTriangle size={11} />}
                        {truck.pilferageRisk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Customer Aging & Smart Credit Lock */}
      {data && activeTab === "aging" && (
        <div className="space-y-6 animate-in">
          {/* 4 Aging Buckets Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Accounts Receivable Aging Buckets
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Categorized receivables exposure across 30, 60, 90, and 90+ days
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Receivables
                </span>
                <span className="text-xl font-black text-slate-900">
                  ₹{data.customerAging.totalReceivables.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.customerAging.buckets.map((bucket, i) => (
                <div
                  key={bucket.label}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    i === 3
                      ? "bg-rose-50/50 border-rose-200"
                      : i === 2
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-slate-50/60 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {bucket.label}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {bucket.count} Clients
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900">
                    ₹{bucket.amount.toLocaleString("en-IN")}
                  </h4>
                  <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        i === 3 ? "bg-rose-600" : i === 2 ? "bg-amber-500" : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, bucket.percentage || 10)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 block text-right">
                    {bucket.percentage}% of total dues
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Credit Lock Intelligence List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Smart Credit Lock & Over-Limit Watchlist
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accounts exceeding the ₹2,00,000 credit ceiling or 60+ days overdue
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {data.customerAging.topAtRisk.length > 0 ? (
                data.customerAging.topAtRisk.map((c) => (
                  <div
                    key={c.id}
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.isCreditLocked && (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-black uppercase">
                            Locked from Dispatch
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Phone: {c.phone_no} • Account #{c.id} • Overdue {c.daysOld} Days
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Balance Due</span>
                        <span className="text-sm font-black text-rose-600">
                          ₹{c.balance.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/customer/details/${c.id}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Open Ledger
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" />
                  <p className="text-xs font-semibold">No customers currently exceed the credit limit threshold.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
