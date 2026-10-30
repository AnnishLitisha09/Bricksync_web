import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore } from "../../../store/vechicle/useVehicleStore";
import toast from "react-hot-toast";
import { ArrowLeft, Car, UploadCloud, CheckCircle2, FileText, Image as ImageIcon, X } from "lucide-react";
import Input from "../../../components/InputBox";

// Define the shape of our validation errors
interface FormErrors {
  vehicleName?: string;
  vehicleNumber?: string;
  kilometer?: string;
}

export default function AddVehicle() {
  const navigate = useNavigate();
  const { addVehicle } = useVehicleStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    vehicleName: "",
    vehicleNumber: "",
    insurance: "",
    pollution: "",
    rcDate: "",
    kilometer: "",
    vehicleImage: null as File | null,
    rcImage: null as File | null,
    insuranceImage: null as File | null,
    pollutionImage: null as File | null,
    speedImage: null as File | null,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.vehicleName.trim()) newErrors.vehicleName = "Vehicle name is required";
    if (!form.vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required";
    } else if (!/^[a-zA-Z0-9 ]+$/.test(form.vehicleNumber)) {
      newErrors.vehicleNumber = "Special characters are not allowed";
    }

    if (!form.kilometer) {
      newErrors.kilometer = "Odometer reading is required";
    } else if (Number(form.kilometer) < 0) {
      newErrors.kilometer = "Odometer reading cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    // Prevent negative numbers for kilometer
    if (name === "kilometer" && Number(value) < 0) return;

    if (name === "vehicleNumber") {
      value = value.toUpperCase();
    }

    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const removeFile = (name: keyof typeof form) => {
    setForm((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value as any);
      }
    });

    try {
      await addVehicle(data);
      toast.success("Vehicle added successfully!");
      navigate("/vehicles");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add vehicle.");
    } finally {
      setLoading(false);
    }
  };


  const FileUploadCard = ({ name, label }: { name: keyof typeof form; label: string }) => {
    const file = form[name] as File | null;
    const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

    useEffect(() => {
      return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    return (
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className={`relative group h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all ${file ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-indigo-400 bg-slate-50/50"
          }`}>
          {previewUrl ? (
            <div className="relative w-full h-full p-2">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-xs" />
              <button type="button" onClick={() => removeFile(name)} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-md hover:bg-rose-600 transition-transform hover:scale-110 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label htmlFor={name} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
              <UploadCloud className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={20} />
              <input id={name} type="file" name={name} accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in font-sans">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              Fleet Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Register <span className="text-indigo-600">Vehicle</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Add a new commercial vehicle or transport asset to your enterprise registry.
          </p>
        </div>
        <div className="hidden sm:flex h-12 w-12 bg-indigo-600 rounded-xl shadow-md shadow-indigo-600/20 items-center justify-center shrink-0">
          <Car className="text-white" size={24} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Core Specs */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <FileText size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Basic Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Vehicle Name" name="vehicleName" placeholder="e.g. BharatBenz 3523R" value={form.vehicleName} onChange={handleChange} required />
            <Input label="Vehicle Number" name="vehicleNumber" placeholder="e.g. DL-01-CA-1234" value={form.vehicleNumber} onChange={handleChange} required />
            <Input label="Odometer Reading (KM)" name="kilometer" type="number" placeholder="Enter current KM" value={form.kilometer} onChange={handleChange} required />
            <Input label="RC Expiry" name="rcDate" type="date" value={form.rcDate} onChange={handleChange} required />
            <Input label="Insurance Expiry" name="insurance" type="date" value={form.insurance} onChange={handleChange} required />
            <Input label="Pollution Expiry" name="pollution" type="date" value={form.pollution} onChange={handleChange} required />
          </div>
        </div>

        {/* Section: Documentation */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <ImageIcon size={18} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Upload Documents</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <FileUploadCard name="vehicleImage" label="Vehicle" />
            <FileUploadCard name="rcImage" label="RC Copy" />
            <FileUploadCard name="insuranceImage" label="Insurance" />
            <FileUploadCard name="pollutionImage" label="Pollution" />
            <FileUploadCard name="speedImage" label="Speed Limit" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Complete Registration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}