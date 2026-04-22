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

const labelClass = "text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-1 block";
const inputClass =
  "w-full bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3 text-sm font-bold " +
  "focus:bg-white focus:ring-0 focus:border-orange-500 transition-all outline-none text-slate-700";

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
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {isGeneralAdd ? "NEW" : "ADD"} <span className="text-orange-600 uppercase">Spares Log</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
            {isGeneralAdd ? "Add Record for Any Vehicle" : `Vehicle ${vehicleNumber}`}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VEHICLE SELECTION */}
        {isGeneralAdd && (
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100">
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

            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all group">
               <Upload size={24} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
               <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 rounded-2xl font-black text-slate-400 bg-white border border-gray-100 hover:bg-gray-50 transition-colors uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <CheckCircle2 size={18} />
                Save Spares Record
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddSparesEntry;
