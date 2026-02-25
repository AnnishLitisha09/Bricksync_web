import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  AlertCircle,
  ArrowRight,
  Plus,
  Calendar,
  Fuel,
  LayoutDashboard,
  Box,
  Truck,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getOfficeSummary,
  getTodayProductionStats,
  getLowStock,
  getProductionHistory
} from "../../api/inventory";
import { useBankStore } from "../../store/bankStore";
import { useFuelStore } from "../../store/fuel/useFuelStore";
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [_stats, lowStockData, historyRes, _summary] = await Promise.all([
          getTodayProductionStats(),
          getLowStock(),
          getProductionHistory(),
          getOfficeSummary(),
          fetchBanks(),
          getFuels(1)
        ]);

        setLowStock(lowStockData);
        const logs = Array.isArray(historyRes) ? historyRes : (historyRes?.data || []);
        setProductionHistory(logs);
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
            className="h-24 w-24 rounded-full border-4 border-orange-500/20 border-t-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          />
          <LayoutDashboard className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 selection:bg-orange-100 selection:text-orange-900">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
      >
        <div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "2rem" }}
            className="h-2 bg-orange-600 rounded-full mb-2"
          />
          <span className="text-sm font-bold uppercase tracking-widest text-orange-600">Enterprise Dynamics</span>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 lg:text-5xl mt-1">
            Welcome, <span className="text-gradient">{user?.name || "Member"}</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-gray-500 max-w-xl">
            Real-time multisite manufacturing intelligence for <span className="text-gray-900 font-bold">Office 1</span> & <span className="text-gray-900 font-bold">Office 2</span>.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="hidden rounded-2xl border bg-white px-6 py-4 text-sm font-bold text-gray-600 lg:flex items-center gap-3 shadow-sm border-gray-100"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-50">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-400">Operational Log</span>
              <span>{new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </motion.div>

          {/* <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/inventory/add")}
            className="flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-sm font-bold text-white shadow-xl transition-all"
          >
            <Plus className="h-5 w-5" />
            New Log
          </motion.button> */}
        </div>
      </motion.div>

      {/* Animated Stats Section */}
      <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Incoming"
          amount={12340} // Placeholder for daily metric
          icon={<ArrowUpRight className="h-6 w-6 text-emerald-600" />}
          delay={0.1}
        />
        <StatCard
          title="Today's Outgoing"
          amount={8254} // Placeholder for daily metric
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
          icon={<Fuel className="h-6 w-6 text-orange-600" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Multi-Series Production Graph with Staggered entry */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="lg:col-span-2 rounded-[2.5rem] glass p-10 relative overflow-hidden group border-white/40"
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
            className="rounded-[2.5rem] bg-gray-900 p-10 text-white shadow-2xl relative overflow-hidden"
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
            className="rounded-[2.5rem] glass p-10 shadow-sm border border-white/40"
          >
            <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-orange-500" />
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

            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => navigate("/inventory/history")}
              className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-50 py-4 text-sm font-black text-orange-600 hover:bg-orange-100 transition-colors"
            >
              System History
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Visual Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-20 pt-10 border-t border-gray-100 flex flex-col items-center gap-4 md:flex-row md:justify-between"
      >
        <div className="flex items-center gap-6">
          <Truck className="h-6 w-6 text-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fleet Active</span>
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-pulse" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">© 2024 BRICKSYNC OPERATING SYSTEM. ALL SYSTEMS SECURE.</p>
      </motion.div>
    </div>
  );
};