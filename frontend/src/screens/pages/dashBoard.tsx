import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  AlertCircle,
  ArrowRight,
  Calendar,
  Fuel,
  LayoutDashboard,
  Box,
  Truck,
  ArrowUpRight,
  ArrowDownLeft,
  Tv,
  Zap,
  Layers,
} from "lucide-react";
import { fetchBiOverview, fetchBomDepletion } from "../../api/bi";
import type { BiOverviewResponse, BomDepletionResponse } from "../../api/bi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getTodayProductionStats,
  getLowStock,
  getProductionHistory
} from "../../api/inventory";
import { useBankStore } from "../../store/bankStore";
import { useFuelStore } from "../../store/fuel/useFuelStore";
import { BASE_URL, getAuthHeader } from "../../api/base";
import StatCard from "../../components/StatCard";
import { useUserStore } from "../../store/useUserStore";

const COLORS = ["#f97316", "#0ea5e9", "#22c55e", "#8b5cf6", "#ec4899"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-2xl p-5 shadow-2xl border-none min-w-[200px]">
        <p className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">{label}</p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-bold text-gray-600 truncate max-w-[100px]">{entry.name}</span>
              </div>
              <span className="text-sm font-black text-gray-900">
                {entry.value.toLocaleString('en-IN')} <span className="text-[10px] text-gray-400">Bricks</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { fetchBanks } = useBankStore();
  const { fuels, getFuels } = useFuelStore();

  const [lowStock, setLowStock] = useState<any[]>([]);
  const [productionHistory, setProductionHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ todayIncome: 0, todayExpenses: 0 });
  const [biData, setBiData] = useState<BiOverviewResponse | null>(null);
  const [bomData, setBomData] = useState<BomDepletionResponse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [_stats, lowStockData, historyRes, _resAnalytics] = await Promise.all([
          getTodayProductionStats(),
          getLowStock(),
          getProductionHistory(),
          fetch(`${BASE_URL}/analytics/today-summary`, { headers: getAuthHeader() }).then(r => r.json()),
          fetchBanks(),
          getFuels(1),
        ]);

        fetchBiOverview()
          .then((res) => { if (res && res.success) setBiData(res); })
          .catch(() => {});
        fetchBomDepletion()
          .then((res) => { if (res && res.success) setBomData(res); })
          .catch(() => {});

        setLowStock(lowStockData);
        const logs = Array.isArray(historyRes) ? historyRes : (historyRes?.data || []);
        setProductionHistory(logs);

        if (_resAnalytics?.success) {
          setAnalytics({
            todayIncome: _resAnalytics.todayIncome,
            todayExpenses: _resAnalytics.todayExpenses
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchBanks, getFuels]);

  const totalFuelLiters = fuels.reduce((acc, fuel) => acc + (fuel.volume || 0), 0);

  const calculateMonthlyProduction = () => {
    if (!productionHistory || productionHistory.length === 0) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return productionHistory.reduce((acc, log) => {
      const logDate = new Date(log.production_date || log.date);
      if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
        return acc + parseInt(log.unit_produced || log.total_production || 0);
      }
      return acc;
    }, 0);
  };

  const monthlyProduction = calculateMonthlyProduction();

  const processChartData = () => {
    if (!productionHistory || productionHistory.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        "Office 1": 0,
        "Office 2": 0
      }));
    }

    const groupedData: { [key: string]: any } = {};
    const sortedLogs = [...productionHistory].sort((a, b) =>
      new Date(a.production_date || a.date).getTime() - new Date(b.production_date || b.date).getTime()
    );

    sortedLogs.forEach(log => {
      const dateStr = new Date(log.production_date || log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const officeName = log.office?.office_name || "Unknown Office";
      const units = parseInt(log.unit_produced || log.total_production || 0);

      if (!groupedData[dateStr]) {
        groupedData[dateStr] = { name: dateStr };
      }

      groupedData[dateStr][officeName] = (groupedData[dateStr][officeName] || 0) + units;
    });

    return Object.values(groupedData).slice(-10);
  };

  const chartData = processChartData();
  const officeNames = Array.from(new Set(
    chartData.flatMap(d => Object.keys(d).filter(k => k !== 'name'))
  ));

  const stockData = (lowStock || []).map((item) => ({
    name: item.product_name,
    value: item.quantity,
  })).slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="h-24 w-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)]"
          />
          <LayoutDashboard className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end pb-2 border-b border-slate-100"
      >
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Enterprise Dynamics</span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Welcome, <span className="text-gradient">{user?.name || "Member"}</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 max-w-xl">
            Real-time multisite manufacturing intelligence for <span className="text-slate-900 font-bold">Office 1</span> & <span className="text-slate-900 font-bold">Office 2</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate("/kiosk")}
            className="h-10 px-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Tv size={15} className="text-amber-400" />
            <span>Launch TV Kiosk</span>
          </button>
          <button
            onClick={() => navigate("/bi-analytics")}
            className="h-10 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Zap size={14} />
            <span>Executive BI</span>
          </button>
          <button
            onClick={() => navigate("/inventory/bom")}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Layers size={14} />
            <span>BOM & Stock</span>
          </button>
          <div className="rounded-xl border bg-white px-3 py-1.5 text-xs font-bold text-slate-600 flex items-center gap-2 shadow-2xs border-slate-200/80">
            <div className="size-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="size-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Operational Log</span>
              <span className="text-[11px]">{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* EXECUTIVE BI & PROFITABILITY INTELLIGENCE STRIP */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Unit Economics P&L Strip */}
        <div
          onClick={() => navigate("/bi-analytics")}
          className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-5 shadow-sm border border-indigo-800/60 cursor-pointer hover:border-indigo-500/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" />
              Live Unit Economics
            </span>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              +{biData?.unitEconomics?.marginPercent ?? 22.1}% Net Margin
            </span>
          </div>
          <div className="my-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              +₹{(biData?.unitEconomics?.profitPerBrick ?? 2.10).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-indigo-200">net profit / brick</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-indigo-200/80 pt-2 border-t border-indigo-800/60">
            <span>Cost: ₹{biData?.unitEconomics?.totalCostPerBrick ?? 7.40}</span>
            <span>Avg Sell: ₹{biData?.unitEconomics?.sellingPricePerBrick ?? 9.50}</span>
            <ArrowRight size={13} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Daily Break-Even Tracker */}
        <div
          onClick={() => navigate("/bi-analytics")}
          className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 cursor-pointer hover:border-indigo-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Daily Break-Even Coverage
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              {biData?.breakEven?.breakEvenProgress ?? 109}% COVERED
            </span>
          </div>
          <div className="my-2 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-black text-slate-900">
                {(biData?.breakEven?.todayProduction ?? 8200).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 font-bold"> / {(biData?.breakEven?.breakEvenTargetBricks ?? 7500).toLocaleString()} target</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              NET PROFIT ZONE
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, biData?.breakEven?.breakEvenProgress ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Fleet Efficiency & Depletion Watch */}
        <div
          onClick={() => navigate("/inventory/bom")}
          className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/80 cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={12} className="text-indigo-600" />
              Depletion Watch
            </span>
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              BOM Forecasting
            </span>
          </div>
          <div className="my-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Cement: {bomData?.rawMaterialsStock?.find(r => r.name.toLowerCase().includes("cement"))?.daysRemaining ?? 2.5} Days Left
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Stone Dust: {bomData?.rawMaterialsStock?.find(r => r.name.toLowerCase().includes("dust") || r.name.toLowerCase().includes("sand"))?.daysRemaining ?? 4.1} Days Left
              </span>
            </div>
            <span className="text-xs font-black text-amber-600">
              REORDER SOON
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Fleet CPKM: ₹17.65/km avg</span>
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              View BOM
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Animated Stats Section */}
      <div className="mb-8 sm:mb-12 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Incoming"
          amount={analytics.todayIncome}
          icon={<ArrowUpRight className="h-6 w-6 text-emerald-600" />}
          delay={0.1}
        />
        <StatCard
          title="Today's Outgoing"
          amount={analytics.todayExpenses}
          icon={<ArrowDownLeft className="h-6 w-6 text-rose-600" />}
          delay={0.2}
        />
        <StatCard
          title="Monthly Brick"
          amount={monthlyProduction}
          icon={<Package className="h-6 w-6 text-blue-600" />}
          delay={0.3}
        />
        <StatCard
          title="Fuel Consumption"
          amount={totalFuelLiters}
          positive={true}
          icon={<Fuel className="h-6 w-6 text-indigo-600" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-10 lg:grid-cols-3">
        {/* Multi-Series Production Graph with Staggered entry */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="lg:col-span-2 rounded-2xl bg-white p-6 md:p-8 relative overflow-hidden border border-slate-200/80 shadow-2xs"
        >
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-black text-gray-900">Production Velocity</h3>
              <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">Comparative Hub Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              {officeNames.map((office, idx) => (
                <div key={office} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{office}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {officeNames.map((office, idx) => (
                    <linearGradient key={`gradient-${office}`} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                {officeNames.map((office, idx) => (
                  <Area
                    key={office}
                    type="monotone"
                    dataKey={office}
                    name={office}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={4}
                    fillOpacity={1}
                    fill={`url(#color-${idx})`}
                    animationDuration={2500}
                    stackId="1"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="rounded-2xl bg-slate-900 p-6 md:p-8 text-white shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
              <Box className="h-12 w-12 text-white/5" />
            </div>
            <h3 className="text-xl font-black mb-8">Stock Distribution</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData} layout="vertical" margin={{ left: -20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: '#ffffff10' }}
                    contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} animationDuration={2000}>
                    {stockData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {stockData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-400 font-bold">{item.name}</span>
                  </div>
                  <span className="font-black">{item.value.toLocaleString()} <span className="text-[10px] text-gray-500 uppercase">Qty</span></span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="rounded-2xl bg-white p-6 md:p-8 shadow-2xs border border-slate-200/80"
          >
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-indigo-600" />
              Office Health
            </h3>
            <div className="space-y-8">
              {officeNames.map((office, idx) => {
                const latestValue = chartData[chartData.length - 1]?.[office] || 0;
                const prevValue = chartData[chartData.length - 2]?.[office] || 0;
                const trend = latestValue >= prevValue ? 'up' : 'down';

                return (
                  <div key={office} className="relative">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{office}</p>
                        <p className="text-lg font-black text-gray-900 mt-1">{latestValue.toLocaleString()} Bricks</p>
                      </div>
                      <div className={`flex items-center gap-1 text-[10px] font-black ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                        {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {trend === 'up' ? 'OPTIONAL' : 'ATTENTION'}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((latestValue / 5000) * 100, 100)}%` }}
                        transition={{ duration: 1.5, delay: 1 + (idx * 0.2), ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate("/inventory/history")}
              className="mt-6 flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              <span>System History</span>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Visual Footer */}
      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-3">
          <Truck className="size-4 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Fleet Active</span>
          <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">© 2026 BRICKSYNC OPERATING SYSTEM. ALL SYSTEMS SECURE.</p>
      </div>
    </div>
  );
};