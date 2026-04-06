import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { createSparesEntry } from "../../../api/spares";
import { fetchVehicles } from "../../../api/vehicle";
import { ArrowLeft, Calendar, Package, IndianRupee, Upload, X, Loader2, CheckCircle2, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

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

    const newImages = await Promise.all(
      files.map(async (file) => {
        const loadingToastId = toast.loading(`Optimizing ${file.name}...`);
        const compressed = await compressImage(file);
        toast.success(`${file.name} ready!`, { id: loadingToastId });
        return {
          file: compressed,
          preview: URL.createObjectURL(compressed),
          compressed: true
        };
      })
    );

    setImages((prev) => [...prev, ...newImages]);
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
    if (!selectedVehicleId || !name || !amount) {
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
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 pb-24 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-4"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">
            {isGeneralAdd ? "New" : "Add"} <span className="text-indigo-600">Spares Log</span>
          </h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2">
            {isGeneralAdd ? "Add Record for Any Vehicle" : `Vehicle ${vehicleNumber}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Selection (Only show if isGeneralAdd) */}
            {isGeneralAdd && (
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 col-span-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select Vehicle</label>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Truck size={20}/></div>
                  <select 
                    className="text-xl font-black bg-transparent outline-none w-full appearance-none cursor-pointer"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={loadingVehicles}
                  >
                    <option value="">Choose a Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicleNumber}</option>
                    ))}
                  </select>
                  {loadingVehicles && <Loader2 className="animate-spin text-slate-300" size={20} />}
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date</label>
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={20}/></div>
                  <input 
                    type="date"
                    className="text-lg font-black bg-transparent outline-none w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Bill Amount (₹)</label>
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><IndianRupee size={20}/></div>
                  <input 
                    type="number"
                    className="text-2xl font-black bg-transparent outline-none w-full"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 col-span-full">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Part / Service Description</label>
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={20}/></div>
                  <input 
                    type="text"
                    className="text-xl font-black bg-transparent outline-none w-full"
                    placeholder="e.g. Engine Oil Change, Tire Replacement"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 block">Digitized Evidence (Images)</label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <AnimatePresence>
                {images.map((img, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={i} 
                    className="aspect-square rounded-2xl overflow-hidden border-4 border-slate-50 relative group"
                  >
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <label className="aspect-square rounded-2xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                 <Upload size={24} className="text-slate-300" />
                 <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <button
               type="submit"
               disabled={isSubmitting}
               className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              {isSubmitting ? "Processing..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSparesEntry;
