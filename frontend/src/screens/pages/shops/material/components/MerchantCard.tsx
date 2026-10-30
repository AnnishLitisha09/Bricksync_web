import React from "react";
import { motion } from "framer-motion";
import {
    Store,
    User,
    Phone,
    MapPin,
    Pencil,
    Trash2,
    ArrowRight,
    Receipt,
    Tag,
    FileText,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import type { Supplier } from "../../../../../store/useMaterialStore";

interface MerchantCardProps {
    shop: Supplier;
    idx: number;
    onViewHistory: (shop: Supplier) => void;
    onEdit: (shop: Supplier) => void;
    onDelete: (id: number) => void;
}

const CATEGORY_STYLES: Record<string, { badge: string; accent: string; iconBg: string }> = {
    Retail: {
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        accent: "from-indigo-600 to-indigo-700",
        iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    Wholesale: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        accent: "from-emerald-600 to-emerald-700",
        iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    Distributor: {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        accent: "from-amber-600 to-amber-700",
        iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    },
    Contractor: {
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        accent: "from-purple-600 to-purple-700",
        iconBg: "bg-purple-50 text-purple-600 border-purple-100",
    },
};

const MerchantCard: React.FC<MerchantCardProps> = ({
    shop,
    idx,
    onViewHistory,
    onEdit,
    onDelete,
}) => {
    const balanceNum = typeof shop.balance === "string" ? parseFloat(shop.balance) : (shop.balance || 0);
    const isSettled = balanceNum <= 0;
    const catStyle = CATEGORY_STYLES[shop.category] || CATEGORY_STYLES.Retail;

    // Parse tags if string or array
    const tagsList: string[] = React.useMemo(() => {
        if (!shop.tags) return [];
        if (Array.isArray(shop.tags)) return shop.tags;
        return String(shop.tags)
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);
    }, [shop.tags]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: Math.min(idx * 0.04, 0.3) }}
            onClick={() => onViewHistory(shop)}
            className="group relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
            {/* Top Accent Line */}
            <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${catStyle.accent} opacity-80 group-hover:opacity-100 transition-opacity`}
            />

            <div className="space-y-4">
                {/* 1. HEADER ROW */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div
                            className={`size-12 rounded-2xl ${catStyle.iconBg} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300`}
                        >
                            <Store size={22} />
                        </div>

                        {/* Title & Category */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                    {shop.shop_name}
                                </h3>
                                <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${catStyle.badge}`}
                                >
                                    {shop.category}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mt-0.5">
                                <User size={12} className="text-slate-400" />
                                <span>{shop.owner_name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(shop);
                            }}
                            title="Edit Merchant Information"
                            className="size-8 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border border-slate-100 hover:border-amber-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(shop.id);
                            }}
                            title="Delete Merchant"
                            className="size-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {/* 2. FINANCIAL BALANCE HIGHLIGHT */}
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                            Outstanding Balance
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black tabular-nums text-slate-900 tracking-tight">
                                ₹{balanceNum.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">INR</span>
                        </div>
                    </div>

                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs ${
                            isSettled
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                        }`}
                    >
                        {isSettled ? (
                            <>
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                <span>Settled</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={13} className="text-rose-600" />
                                <span>Due Payment</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. ADDITIONAL INFORMATION FIELDS: GST, TAGS, NOTES */}
                {(shop.gst_number || tagsList.length > 0 || shop.notes) && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                        {/* GST Number Badge */}
                        {shop.gst_number && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold tracking-wider">
                                    <Receipt size={12} className="text-indigo-600" />
                                    <span>GSTIN: {shop.gst_number}</span>
                                </span>
                            </div>
                        )}

                        {/* Custom Tags */}
                        {tagsList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {tagsList.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-100 text-[10px] font-bold tracking-tight"
                                    >
                                        <Tag size={10} className="text-indigo-500" />
                                        <span>#{tag}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Notes Preview */}
                        {shop.notes && (
                            <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <FileText size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                <p className="line-clamp-1 italic text-[11px] font-medium text-slate-600">
                                    {shop.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. CONTACT & ADDRESS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {/* Phone */}
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${shop.phone_no}`;
                        }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/60 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors border border-slate-100/80 text-slate-700 font-semibold truncate cursor-pointer"
                        title="Click to Call"
                    >
                        <div className="size-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                            <Phone size={11} />
                        </div>
                        <span className="truncate">{shop.phone_no}</span>
                    </div>

                    {/* Address */}
                    <div
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-100/80 text-slate-500 font-medium truncate"
                        title={shop.address}
                    >
                        <div className="size-6 rounded-lg bg-white shadow-2xs flex items-center justify-center text-rose-500 shrink-0">
                            <MapPin size={11} />
                        </div>
                        <span className="truncate">{shop.address}</span>
                    </div>
                </div>
            </div>

            {/* 5. FOOTER LINK */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Vendor Ledger #{shop.id}
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all">
                    <span>View Ledger & Records</span>
                    <ArrowRight size={13} />
                </span>
            </div>
        </motion.div>
    );
};

export default MerchantCard;
