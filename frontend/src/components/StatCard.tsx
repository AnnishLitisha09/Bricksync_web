import React, { useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export type StatCardProps = {
  title: string;
  amount: string | number;
  change?: string | number;
  positive?: boolean;
  icon?: React.ReactNode;
  delay?: number;
};

const formatToRupees = (value: number) => {
  return `₹${value.toLocaleString("en-IN")}`;
};

const AnimatedNumber: React.FC<{ value: number; isCurrency: boolean }> = ({ value, isCurrency }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const roundedVal = Math.floor(latest);
    return isCurrency ? formatToRupees(roundedVal) : roundedVal.toLocaleString("en-IN");
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  change,
  positive = true,
  icon,
  delay = 0,
}) => {
  const isCurrency = typeof amount === 'number' && (title.toLowerCase().includes('balance') || title.toLowerCase().includes('consolidated'));
  const amountNumber = typeof amount === 'number' ? amount : parseFloat(amount.toString().replace(/,/g, '')) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all p-5 select-none"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform duration-200 shrink-0">
              {icon}
            </div>
          )}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {title}
            </span>
          </div>
        </div>
        {change && change !== "" && (
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            positive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          <AnimatedNumber value={amountNumber} isCurrency={isCurrency} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {title.toLowerCase().includes('fuel') ? 'liters' :
            title.toLowerCase().includes('balance') || title.toLowerCase().includes('consolidated') ? '' : 'units'}
        </span>
      </div>
    </motion.div>
  );
};

export default StatCard;
