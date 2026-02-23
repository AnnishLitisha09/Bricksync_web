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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40"
    >
      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl opacity-10 transition-all group-hover:opacity-20 ${positive ? 'bg-green-500' : 'bg-red-500'}`} />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-gray-500 block">{title}</span>
            </div>
          </div>
          {change && change !== "" && (
            <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {change}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-gray-900">
            <AnimatedNumber value={amountNumber} isCurrency={isCurrency} />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {title.toLowerCase().includes('fuel') ? 'liters' :
              title.toLowerCase().includes('balance') || title.toLowerCase().includes('consolidated') ? '' : 'units'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
