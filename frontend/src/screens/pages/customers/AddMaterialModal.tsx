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
  Layers,
  Building2,
  Plus,
  Trash2,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
}

// Mock Data for Dropdowns
const OPTIONS = {
  offices: ["Main Branch", "South Warehouse", "Site Office A", "Regional Hub"],
  vehicles: ["GJ-01-AX-1234", "GJ-01-BX-5678", "GJ-01-CX-9012", "GJ-05-BT-4422"],
  materials: ["Cement Sacks", "Steel Bars (12mm)", "Bricks (Red)", "Aggregates", "Sand"],
  drivers: ["Rajesh Kumar", "Suresh Pal", "Amit Singh", "Vikram Rathore"],
  loaders: ["Team Alpha", "Team Bravo", "Local Crew 01", "In-house Staff"]
};

const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-1 block";
const inputClass = "w-full px-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none";

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, customerId }) => {
  const [entryMode, setEntryMode] = useState<"today" | "bulk">("today");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [globalDate, setGlobalDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportCharge, setTransportCharge] = useState<string>("0");

  const [materials, setMaterials] = useState([
    { 
      id: Date.now(), 
      office: "", 
      vehicleNumber: "", 
      particulars: "", 
      qty: "", 
      rate: "", 
      driver: "", 
      loader: "" 
    }
  ]);

  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const addMaterialRow = () => {
    setMaterials([...materials, { 
      id: Date.now() + Math.random(), 
      office: "", 
      vehicleNumber: "", 
      particulars: "", 
      qty: "", 
      rate: "", 
      driver: "", 
      loader: "" 
    }]);
  };

  const removeMaterialRow = (id: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  // Calculate Total: Sum of (Qty * Rate) + Transport Charge
  const materialSubtotal = materials.reduce((sum, m) => sum + (Number(m.qty) * Number(m.rate)), 0);
  const finalTotal = materialSubtotal + Number(transportCharge);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submission:", { 
      date: globalDate, 
      materials, 
      transportCharge: Number(transportCharge),
      totalAmount: finalTotal 
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-4 shrink-0">
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Material <span className="text-indigo-600">Entry</span></h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Customer: {customerId}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>

        {/* DATE & MODE SELECTOR */}
        <div className="flex gap-3 mb-6 shrink-0">
            <div className="flex-1 flex p-1.5 bg-slate-100 rounded-[2rem] relative">
                <button type="button" onClick={() => setEntryMode("today")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "today" ? "text-indigo-600" : "text-slate-400"}`}>Today</button>
                <button type="button" onClick={() => setEntryMode("bulk")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all z-10 ${entryMode === "bulk" ? "text-indigo-600" : "text-slate-400"}`}>Bulk</button>
                <motion.div className="absolute inset-1.5 bg-white rounded-[1.6rem] shadow-sm" animate={{ x: entryMode === "today" ? "0%" : "100%" }} style={{ width: "calc(50% - 12px)" }} />
            </div>
            <div className="w-1/3">
                <input type="date" value={globalDate} onChange={(e) => setGlobalDate(e.target.value)} className={`${inputClass} !py-[10px] text-sm`} />
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {entryMode === "today" ? (
              <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                
                {materials.map((mat, index) => (
                  <div key={mat.id} className="p-6 border-2 border-slate-100 rounded-[2.5rem] space-y-4 bg-white hover:border-indigo-100 transition-colors relative">
                    <div className="flex justify-between items-center mb-2">
                        <span className="bg-slate-900 text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest">Item #{index + 1}</span>
                        {index > 0 && (
                            <button type="button" onClick={() => removeMaterialRow(mat.id)} className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 text-[10px] font-black uppercase">
                                <Trash2 size={14} /> Remove
                            </button>
                        )}
                    </div>

                    {/* OFFICE & VEHICLE DROPDOWNS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className={labelClass}>Dispatch Office</label>
                            <Building2 className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                            <select className={`${inputClass} pl-12`} value={mat.office} onChange={(e) => updateMaterial(index, 'office', e.target.value)} required>
                                <option value="">Office...</option>
                                {OPTIONS.offices.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className={labelClass}>Vehicle Number</label>
                            <Truck className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                            <select className={`${inputClass} pl-12`} value={mat.vehicleNumber} onChange={(e) => updateMaterial(index, 'vehicleNumber', e.target.value)} required>
                                <option value="">Vehicle...</option>
                                {OPTIONS.vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="relative">
                      <label className={labelClass}>Material Particulars</label>
                      <Package className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                      <select className={`${inputClass} pl-12`} value={mat.particulars} onChange={(e) => updateMaterial(index, 'particulars', e.target.value)} required>
                        <option value="">Select Material</option>
                        {OPTIONS.materials.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Quantity</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="number" placeholder="0" className={`${inputClass} pl-12`} value={mat.qty} onChange={(e) => updateMaterial(index, 'qty', e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Rate</label>
                        <div className="relative">
                            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="number" placeholder="0.00" className={`${inputClass} pl-12`} value={mat.rate} onChange={(e) => updateMaterial(index, 'rate', e.target.value)} required />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className={labelClass}>Driver</label>
                        <User className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                        <select className={`${inputClass} pl-12`} value={mat.driver} onChange={(e) => updateMaterial(index, 'driver', e.target.value)}>
                            <option value="">Driver...</option>
                            {OPTIONS.drivers.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="relative">
                        <label className={labelClass}>Loader</label>
                        <Users className="absolute left-4 bottom-4 text-slate-300 pointer-events-none" size={18} />
                        <select className={`${inputClass} pl-12`} value={mat.loader} onChange={(e) => updateMaterial(index, 'loader', e.target.value)}>
                            <option value="">Loader...</option>
                            {OPTIONS.loaders.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                    type="button" 
                    onClick={addMaterialRow}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> Add Another Material
                </button>
              </motion.div>
            ) : (
              <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10">
                <div onClick={() => fileInputRef.current?.click()} className="group w-full aspect-[21/10] bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-50/30 transition-all">
                  <div className="p-5 bg-white rounded-3xl shadow-xl text-indigo-600 group-hover:scale-110 transition-transform">{bulkFile ? <CheckCircle2 size={32} /> : <Upload size={32} />}</div>
                  <p className="mt-4 text-sm font-black text-slate-700 uppercase tracking-tighter px-6 text-center truncate w-full">{bulkFile ? bulkFile.name : "Upload Dispatch PDF"}</p>
                  <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* SUMMARY & SUBMIT */}
        <div className="pt-6 shrink-0 bg-white border-t border-slate-50 mt-4 space-y-4">
            {/* TRANSPORT CHARGE INPUT */}
            <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                    <label className={labelClass}>Transport Charge</label>
                    <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input 
                            type="number" 
                            className={`${inputClass} pl-12 !py-3`} 
                            value={transportCharge} 
                            onChange={(e) => setTransportCharge(e.target.value)} 
                        />
                    </div>
                </div>
                <div className="bg-indigo-600 p-4 rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-100 h-[58px]">
                    <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Total Credit</span>
                    <span className="text-xl font-black text-white">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <button type="submit" onClick={handleSubmit} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]">
                <FileText size={18} /> Confirm Dispatch
            </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddMaterialModal;