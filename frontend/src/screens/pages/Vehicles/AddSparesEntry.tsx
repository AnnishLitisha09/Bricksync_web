import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createSparesEntry } from "../../../api/spares";
import { fetchVehicles } from "../../../api/vehicle";
import { ArrowLeft, Calendar, Package, IndianRupee, Upload, X, Loader2, CheckCircle2, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import SearchableVehicleSelect from "../../../components/SearchableVehicleSelect";

// Simple Canvas-based Image Compression Utility
const compressImage = (file: File, quality = 0.7, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
    };
  });
};

const labelClass = "text-[11px] font-semibold text-slate-500 block mb-1";
const inputClass =
  "w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl font-medium text-xs text-slate-800 " +
  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all outline-none";

const AddSparesEntry: React.FC = () => {
  const { vehicleId: urlVehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isGeneralAdd = !urlVehicleId || urlVehicleId === "new";
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(isGeneralAdd ? "" : urlVehicleId);
  const [vehicleNumber] = useState(location.state?.vehicleNumber || "Vehicle");

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string; compressed: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(isGeneralAdd);

  useEffect(() => {
    if (isGeneralAdd) {
      loadVehicles();
    }
  }, [isGeneralAdd]);

  const loadVehicles = async () => {
    try {
      const res = await fetchVehicles();
      setVehicles(res);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const loadingToastId = toast.loading(`Optimizing ${file.name}...`);
      const compressed = await compressImage(file);
      toast.success(`${file.name} ready!`, { id: loadingToastId });
      setImages((prev) => [...prev, {
        file: compressed,
        preview: URL.createObjectURL(compressed),
        compressed: true
      }]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneralAdd && !selectedVehicleId) {
      toast.error("Please select a vehicle");
      return;
    }
    if (!name || !amount) {
      toast.error("Please fill required fields");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("vehicle_id", selectedVehicleId!);
    formData.append("date", date);
    formData.append("name", name);
    formData.append("bill_amount", amount);
    
    images.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      await createSparesEntry(formData);
      toast.success("Entry saved!");
      if (isGeneralAdd) {
        navigate("/vehicle/spares");
      } else {
        navigate(`/vehicle/spares/${selectedVehicleId}`, { state: { vehicleNumber } });
      }
    } catch (error) {
      toast.error("Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-4 pb-24"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              {isGeneralAdd ? "Fleet Inventory" : `Vehicle ${vehicleNumber}`}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isGeneralAdd ? "New" : "Add"} <span className="text-indigo-600">Spares Log</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Record replacement parts, hardware expenses & service bills</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VEHICLE SELECTION */}
        {isGeneralAdd && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="space-y-1">
              <label className={labelClass}><Truck size={12} className="inline mr-1" /> Target Vehicle</label>
              <SearchableVehicleSelect
                vehicles={vehicles}
                value={selectedVehicleId}
                onChange={(id) => setSelectedVehicleId(id)}
                placeholder="Search Vehicle by Number..."
                disabled={loadingVehicles}
              />
            </div>
          </div>
        )}

        {/* LOG DETAILS */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}><Calendar size={12} className="inline mr-1" /> Log Date</label>
              <input 
                type="date"
                className={inputClass}
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}><IndianRupee size={12} className="inline mr-1" /> Bill Amount (₹)</label>
              <input 
                type="number"
                className={inputClass}
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="space-y-1">
            <label className={labelClass}><Package size={12} className="inline mr-1" /> Spares / Parts Description</label>
            <input 
              type="text"
              className={inputClass}
              placeholder="e.g. Engine Oil, Tire Replacement, Brake Pads"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* IMAGES */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <label className={labelClass}><Upload size={12} className="inline mr-1" /> Transaction Evidence (Images)</label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
            <AnimatePresence>
              {images.map((img, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={i} 
                  className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-50 relative group shadow-sm"
                >
                  <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all group">
               <Upload size={24} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
               <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-11 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors uppercase tracking-wider text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Spares Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddSparesEntry;
