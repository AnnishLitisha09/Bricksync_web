import React from "react";
import { motion } from "framer-motion";
import {
    Store,
    User,
    CreditCard,
    Phone,
    MapPin,
    Pencil,
    Trash2,
    Info,
    ArrowUpRight,
    ExternalLink
} from "lucide-react";

interface ShopEntry {
    id: number;
    shop_name: string;
    owner_name: string;
    phone_no: string;
    address: string;
    category: string;
    balance: string | number;
    createdAt: string;
}

interface MerchantCardProps {
    shop: ShopEntry;
    idx: number;
    onViewHistory: (shop: ShopEntry) => void;
    onEdit: (shop: ShopEntry) => void;
    onDelete: (id: number) => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({
    shop,
    idx,
    onViewHistory,
    onEdit,
    onDelete
}) => {
    const balanceNum = typeof shop.balance === 'string' ? parseFloat(shop.balance) : shop.balance;
    const isHighBalance = balanceNum > 50000;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onViewHistory(shop)}
            className="group relative bg-white rounded-[3rem] p-2 pr-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all overflow-hidden cursor-pointer"
        >
            {isHighBalance && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16" />}

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* ICON BOX */}
                <div className="relative w-full md:w-56 h-44 bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 flex items-center justify-center m-2 shrink-0">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="bg-white p-3 rounded-full shadow-xl">
                            <ExternalLink size={20} className="text-indigo-600" />
                        </div>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Store size={40} className="text-indigo-100 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="absolute bottom-4 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-100" />
                    </div>
                </div>

                {/* CORE DETAILS */}
                <div className="flex-1 w-full py-4 space-y-6">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">{shop.shop_name}</h2>
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                                    {shop.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <User size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Managed by {shop.owner_name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</p>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={18} className="text-slate-300" />
                                    <span className="text-3xl font-black tabular-nums text-slate-900">
                                        ₹{balanceNum.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <ArrowUpRight size={20} />
                            </div>
                        </div>
                    </div>

                    {/* INFO GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                            <div className="p-2 bg-white shadow-sm rounded-xl text-indigo-500">
                                <Phone size={14} />
                            </div>
                            <p className="text-xs font-black text-slate-600 tracking-tight">{shop.phone_no}</p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:bg-white transition-all">
                            <div className="p-2 bg-white shadow-sm rounded-xl text-teal-500">
                                <MapPin size={14} />
                            </div>
                            <p className="text-xs font-black text-slate-600 tracking-tight truncate max-w-[200px]">{shop.address}</p>
                        </div>
                    </div>
                </div>

                {/* SIDE ACTIONS */}
                <div className="flex flex-col gap-2 relative z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(shop);
                        }}
                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100 shadow-sm"
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(shop.id);
                        }}
                        className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100 shadow-sm"
                    >
                        <Trash2 size={18} />
                    </button>
                    <div className="p-2 text-slate-200 group-hover:text-indigo-200 transition-colors">
                        <Info size={20} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MerchantCard;
