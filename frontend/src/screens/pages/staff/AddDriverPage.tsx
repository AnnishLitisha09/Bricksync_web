import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserPlus, Mail, Phone, Lock, IndianRupee, 
  Calendar, FileText, ChevronLeft, Save, 
  UploadCloud, X, CheckCircle2, UserCircle 
} from "lucide-react";
import { BASE_URL, getAuthHeader } from "../../../api/base";

export default function AddDriverPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    amount: "",
    drivingLicenceValidity: "",
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    image: null,
    aadhar: null,
    drivingLicence: null,
    drivingLicenceBack: null,
  });

  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [name]: file }));
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [name]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[name];
        return newPreviews;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phoneNumber) {
      alert("Please fill in the core details.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    try {
      const res = await fetch(`${BASE_URL}/driver/create-driver`, {
        method: "POST",
        headers: { ...getAuthHeader() },
        body: formData,
      });
      if (res.ok) navigate("/staff");
    } catch (error) {
      console.error("Error creating driver", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 lg:hidden flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-black text-slate-900">New Driver</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-10">
        {/* Desktop Header */}
        <button 
          onClick={() => navigate(-1)}
          className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all mb-8 group"
        >
          <div className="p-2 rounded-xl group-hover:bg-indigo-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Back to Fleet
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Progress Section */}
          <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit space-y-6">
            <div className="hidden lg:block space-y-4">
              <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 mb-6">
                <UserPlus size={36} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">Driver<br/>Onboarding</h1>
              <p className="text-slate-500 font-medium">Create a digital profile and verify legal documents.</p>
            </div>

            {/* Steps - Responsive Layout */}
            <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-4 lg:gap-6 bg-white lg:bg-transparent p-4 lg:p-0 rounded-3xl border border-slate-100 lg:border-none shadow-sm lg:shadow-none">
              <StepItem icon={<UserCircle size={18}/>} title="Identity" active />
              <div className="h-px flex-1 lg:hidden bg-slate-100" />
              <StepItem icon={<FileText size={18}/>} title="Docs" active />
              <div className="h-px flex-1 lg:hidden bg-slate-100" />
              <StepItem icon={<CheckCircle2 size={18}/>} title="Done" />
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-8 space-y-6 pb-20 lg:pb-0">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              
              {/* Profile Information */}
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm transition-all hover:shadow-md">
                <SectionHeader number="01" title="General Details" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
                  <Input 
                    icon={<UserPlus size={18}/>} label="Full Name" name="name" 
                    placeholder="E.g. Rahul Kumar" value={form.name} onChange={handleChange} 
                  />
                  <Input 
                    icon={<Mail size={18}/>} label="Email Address" name="email" 
                    type="email" placeholder="rahul@example.com" value={form.email} onChange={handleChange} 
                  />
                  <Input 
                    icon={<Phone size={18}/>} label="Phone Number" name="phoneNumber" 
                    placeholder="+91 00000 00000" value={form.phoneNumber} onChange={handleChange} 
                  />
                  <Input 
                    icon={<Lock size={18}/>} label="Portal Password" name="password" 
                    type="password" placeholder="Set a secure password" value={form.password} onChange={handleChange} 
                  />
                  <Input 
                    icon={<IndianRupee size={18}/>} label="Base Salary" name="amount" 
                    type="number" placeholder="Enter amount" value={form.amount} onChange={handleChange} 
                  />
                  <Input 
                    icon={<Calendar size={18}/>} label="License Expiry" name="drivingLicenceValidity" 
                    type="date" value={form.drivingLicenceValidity} onChange={handleChange} 
                  />
                </div>
              </div>

              {/* Document Section */}
              <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 p-6 md:p-10 shadow-sm transition-all hover:shadow-md">
                <SectionHeader number="02" title="Verification Documents" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <FileDrop label="Profile Picture" preview={previews.image} onChange={(f) => handleFileChange("image", f)} />
                  <FileDrop label="Aadhar Card" preview={previews.aadhar} onChange={(f) => handleFileChange("aadhar", f)} />
                  <FileDrop label="DL (Front)" preview={previews.drivingLicence} onChange={(f) => handleFileChange("drivingLicence", f)} />
                  <FileDrop label="DL (Back)" preview={previews.drivingLicenceBack} onChange={(f) => handleFileChange("drivingLicenceBack", f)} />
                </div>
              </div>

              {/* Mobile Sticky Footer Actions */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-slate-100 lg:relative lg:bg-transparent lg:border-none lg:p-0 flex items-center justify-between lg:justify-end gap-4 z-40">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="hidden md:block px-8 py-4 text-slate-400 font-bold hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full lg:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl transition-all shadow-xl shadow-slate-200 disabled:opacity-50 font-black tracking-tight active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {loading ? "Processing..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- REFINED SUBCOMPONENTS --- */

const SectionHeader = ({ number, title }: { number: string, title: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="text-3xl font-black text-slate-100 tracking-tighter leading-none select-none">{number}</span>
    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">{title}</h2>
  </div>
);

const StepItem = ({ icon, title, active = false }: { icon: React.ReactNode, title: string, active?: boolean }) => (
  <div className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 ${active ? "text-indigo-600" : "text-slate-300"}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}>
      {icon}
    </div>
    <span className="text-[10px] lg:text-sm font-black uppercase lg:normal-case tracking-widest lg:tracking-normal">{title}</span>
  </div>
);

const Input = ({ label, icon, ...props }: { label: string; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="w-full bg-slate-50/50 border-2 border-slate-50 focus:border-indigo-500/20 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-200"
      />
    </div>
  </div>
);

const FileDrop = ({ label, preview, onChange }: { label: string; preview?: string; onChange: (file: File | null) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className={`relative group border-2 border-dashed rounded-3xl transition-all h-36 md:h-40 overflow-hidden flex flex-col items-center justify-center ${preview ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200"}`}>
      {preview ? (
        <div className="relative w-full h-full">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(null)} className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-sm rounded-xl text-red-500"><X size={16} /></button>
        </div>
      ) : (
        <>
          <div className="p-3 bg-white rounded-xl shadow-sm mb-2"><UploadCloud size={20} className="text-indigo-500" /></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tap to Upload</span>
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} />
        </>
      )}
    </div>
  </div>
);