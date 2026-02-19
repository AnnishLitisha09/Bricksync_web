import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore } from "../../../store/vechicle/useVehicleStore";
import toast from "react-hot-toast";
import { ArrowLeft, Car, UploadCloud, CheckCircle2, FileText, Image as ImageIcon, X, AlertCircle } from "lucide-react";
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
    if (!form.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle number is required";
    if (!form.kilometer) newErrors.kilometer = "Odometer reading is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

  const renderError = (message?: string) => {
    if (!message) return null;
    return (
      <p className="flex items-center gap-1 mt-1 text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={12} /> {message}
      </p>
    );
  };

  const FileUploadCard = ({ name, label }: { name: keyof typeof form; label: string }) => {
    const file = form[name] as File | null;
    const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

    useEffect(() => {
      return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    return (
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className={`relative group h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all ${file ? "border-orange-500 bg-orange-50/30" : "border-gray-200 hover:border-orange-400 bg-gray-50/50"
          }`}>
          {previewUrl ? (
            <div className="relative w-full h-full p-2">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl shadow-sm" />
              <button type="button" onClick={() => removeFile(name)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-transform hover:scale-110">
                <X size={14} />
              </button>
            </div>
          ) : (
            <label htmlFor={name} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
              <UploadCloud className="text-gray-400 group-hover:text-orange-500 transition-colors" size={20} />
              <input id={name} type="file" name={name} accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Top Navigation & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors mb-4 group"
          >
            <div className="p-2 rounded-full group-hover:bg-orange-50 transition-colors">
              <ArrowLeft size={20} />
            </div>
            <span className="font-medium">Back to Fleet</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Register Vehicle</h1>
              <p className="text-gray-500 mt-1 font-medium">Add a new asset to your transport management system.</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 bg-orange-500 rounded-2xl shadow-lg shadow-orange-200 items-center justify-center">
              <Car className="text-white" size={28} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Core Specs */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <FileText size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Basic Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Vehicle Name" name="vehicleName" placeholder="e.g. BharatBenz 3523R" value={form.vehicleName} onChange={handleChange} required />
              <Input label="Vehicle Number" name="vehicleNumber" placeholder="e.g. DL-01-CA-1234" value={form.vehicleNumber} onChange={handleChange} required />
              <Input label="Odometer Reading (KM)" name="kilometer" type="number" placeholder="Enter current KM" value={form.kilometer} onChange={handleChange} required />
              <Input label="RC Expiry" name="rcDate" type="date" value={form.rcDate} onChange={handleChange} required />
              <Input label="Insurance Expiry" name="insurance" type="date" value={form.insurance} onChange={handleChange} required />
              <Input label="Pollution Expiry" name="pollution" type="date" value={form.pollution} onChange={handleChange} required />
            </div>
          </div>

          {/* Section: Documentation */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <ImageIcon size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Upload Documents</h2>
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
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl text-lg font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  Complete Registration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}