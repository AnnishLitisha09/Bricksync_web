import React, { useState, useRef } from "react";
import { 
  X, 
  Package, 
  Truck, 
  Calendar, 
  User, 
  Users, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Hash,
  IndianRupee,
  Layers // Swapped CircleStack for Layers for better compatibility
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";
const inputClass = "w-full px-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all";

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, customerId }) => {
  const [entryMode, setEntryMode] = useState<"today" | "bulk">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: "",
    particulars: "",
    qty: "",
    rate: "",
    driver: "",
    loader: "",
  });

  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // Calculate total automatically
  const totalAmount = Number(formData.qty) * Number(formData.rate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === "today") {
      console.log("Manual Entry:", { ...formData, totalAmount });
    } else {
      console.log("Bulk Entry (PDF):", bulkFile);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl relative z-10 overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Material <span className="text-indigo-600">Entry</span>
            </h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Customer: {customerId}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* TOGGLE SWITCH */}
        <div className="flex p-1.5 bg-slate-100 rounded-[2rem] mb-8 relative">
          <button 
            type="button"
            onClick={() => setEntryMode("today")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "today" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <Calendar size={14} /> Today's Entry
          </button>
          <button 
            type="button"
            onClick={() => setEntryMode("bulk")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "bulk" ? "text-indigo-600" : "text-slate-400"}`}
          >
            <Layers size={14} /> Bulk Entry
          </button>
          <motion.div 
            className="absolute inset-1.5 bg-white rounded-[1.6rem] shadow-sm"
            animate={{ x: entryMode === "today" ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: "calc(50% - 12px)" }}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div 
                key="today"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* ROW 1: DATE & VEHICLE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Dispatch Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Vehicle Number</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" placeholder="GJ-01-XX-0000" className={`${inputClass} pl-12 uppercase`} value={formData.vehicleNumber} onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* ROW 2: PARTICULARS */}
                <div>
                  <label className={labelClass}>Material Particulars</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="e.g. 500 Sacks of Cement" className={`${inputClass} pl-12`} value={formData.particulars} onChange={(e) => setFormData({...formData, particulars: e.target.value})} required />
                  </div>
                </div>

                {/* ROW 3: QTY & RATE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="number" placeholder="00" className={`${inputClass} pl-12`} value={formData.qty} onChange={(e) => setFormData({...formData, qty: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Rate (per unit)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="number" placeholder="0.00" className={`${inputClass} pl-12`} value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} required />
                    </div>
                  </div>
                </div>

                {/* ROW 4: DRIVER & LOADER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Driver Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" placeholder="Driver Name" className={`${inputClass} pl-12`} value={formData.driver} onChange={(e) => setFormData({...formData, driver: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Loader Name</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input type="text" placeholder="Loader Name" className={`${inputClass} pl-12`} value={formData.loader} onChange={(e) => setFormData({...formData, loader: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* TOTAL SUMMARY PILL */}
                {totalAmount > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Credit Amount</span>
                    <span className="text-xl font-black text-indigo-600">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="bulk"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="py-10"
              >
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group w-full aspect-[21/10] bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-50/30 transition-all"
                >
                  <div className="p-5 bg-white rounded-3xl shadow-xl text-indigo-600 group-hover:scale-110 transition-transform">
                    {bulkFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-700 uppercase tracking-tighter px-6 text-center truncate w-full">
                    {bulkFile ? bulkFile.name : "Upload Dispatch PDF"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Accepts .PDF only</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept=".pdf" 
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <FileText size={18} />
            {entryMode === "today" ? "Confirm Dispatch" : "Upload & Process"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AddMaterialModal;