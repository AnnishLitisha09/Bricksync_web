import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CameraIcon,
  CheckCircle,
  Fingerprint,
  Mail,
  Save,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BASE_URL, FILE_BASE_URL } from "../../../api/base";
import {
  getProfile,
  updateAadhaarImage,
  updateDrivingLicenceBack,
  updateDrivingLicenceImage,
  updateProfileImage,
} from "../../../api/user";
import { useUserStore } from "../../../store/useUserStore";

export default function ProfilePage() {
  const { user, setUser } = useUserStore();
  const profileRef = useRef<HTMLInputElement | null>(null);
  const aadhaarRef = useRef<HTMLInputElement | null>(null);
  const licenceRef = useRef<HTMLInputElement | null>(null);
  const licenceBackRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [validityDate, setValidityDate] = useState<string>("");
  const [editedFields, setEditedFields] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    loadProfile();
  }, [setUser]);

  const loadProfile = async () => {
    const data = await getProfile();
    setUser(data);
    setEditedFields({
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
    });
    if (data.drivingLicenceValidity)
      setValidityDate(data.drivingLicenceValidity.split("T")[0]);
  };

  const handleFileUpload = async (file: File | undefined, uploadFn: (file: File) => Promise<void>) => {
    if (!file) return;
    setLoading(true);
    try {
      await uploadFn(file);
      await loadProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleLicenceBackUpload = async (file: File | undefined) => {
    if (!file || !validityDate) return alert("Please select validity date first.");
    setLoading(true);
    try {
      await updateDrivingLicenceBack(file, validityDate);
      await loadProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async (field: "name" | "email" | "phoneNumber") => {
    if (!user) return;
    const value = editedFields[field];
    if (value === user[field]) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append(field, value);
      const res = await fetch(`${BASE_URL}/user/profile/update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error(`Failed to update ${field}`);
      await loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* --- HERO BANNER --- */}
      <div className="h-64 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/40 to-purple-600/40" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: IDENTITY CARD --- */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 border border-slate-100 backdrop-blur-sm relative overflow-hidden">
              {/* Profile Image Wrap */}
              <div className="relative w-48 h-48 mx-auto group">
                <div className="absolute inset-0 bg-indigo-500 rounded-[2.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden ring-4 ring-white shadow-xl bg-slate-100">
                  <img
                    src={user?.imageUrl ? `${FILE_BASE_URL}${user.imageUrl}` : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => profileRef.current?.click()}
                  className="absolute bottom-2 right-2 p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110 active:scale-90"
                >
                  <CameraIcon size={20} />
                </button>
              </div>

              <div className="text-center mt-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{user?.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {user?.userRole === 1 ? 'Administrator' : 'Verified Member'}
                  </span>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-100"><Wallet size={18}/></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet</p>
                  </div>
                  <span className="text-lg font-black text-slate-900">₹{user?.amount?.toLocaleString()}</span>
                </div>
                
              </div>
            </div>
            
            <input ref={profileRef} type="file" hidden accept="image/*" onChange={(e) => handleFileUpload(e.target.files?.[0], updateProfileImage)} />
          </motion.div>

          {/* --- RIGHT COLUMN: FORMS & DOCUMENTS --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PERSONAL DETAILS CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><User size={22}/></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Personal Details</h3>
                  <p className="text-xs font-bold text-slate-400">Keep your primary contact info up to date</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <LuxuryInput 
                  label="Full Name" value={editedFields.name} original={user?.name} icon={<User size={18}/>}
                  onChange={(val: string) => setEditedFields(p => ({...p, name: val}))} 
                  onSave={() => handleSaveField("name")} 
                />
                <LuxuryInput 
                  label="Email Address" value={editedFields.email} original={user?.email} icon={<Mail size={18}/>}
                  onChange={(val: string) => setEditedFields(p => ({...p, email: val}))} 
                  onSave={() => handleSaveField("email")} 
                />
                <LuxuryInput 
                  label="Phone Number" value={editedFields.phoneNumber} original={user?.phoneNumber} icon={<Smartphone size={18}/>}
                  onChange={(val: string) => setEditedFields(p => ({...p, phoneNumber: val}))} 
                  onSave={() => handleSaveField("phoneNumber")} 
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Platform Role</label>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                    <ShieldCheck size={18} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-600 uppercase">{user?.userRole === 1 ? "Administrator" : "User Access"}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* DOCUMENT VAULT CARD */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Fingerprint size={22}/></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Document Vault</h3>
                  <p className="text-xs font-bold text-slate-400">Securely stored identification proofs</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DocCard 
                  title="Aadhaar Verification" img={user?.aadharUrl} inputRef={aadhaarRef} 
                  onUpload={(e) => handleFileUpload(e.target.files?.[0], updateAadhaarImage)} 
                />
                <DocCard 
                  title="Licence Front" img={user?.drivingLicenceUrl} inputRef={licenceRef} 
                  onUpload={(e) => handleFileUpload(e.target.files?.[0], updateDrivingLicenceImage)} 
                />
                <div className="md:col-span-2">
                  <DocCard 
                    title="Licence Back (Verification)" img={user?.drivingLicenceBackUrl} inputRef={licenceBackRef} 
                    onUpload={(e) => handleLicenceBackUpload(e.target.files?.[0])}
                    date={validityDate} setDate={setValidityDate}
                    isBack
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function LuxuryInput({ label, value, original, onChange, onSave, icon }: any) {
  const isChanged = value !== original;
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-600 transition-colors">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors">{icon}</div>
        <input 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-4 pl-12 pr-12 rounded-2xl font-bold text-sm outline-none transition-all ${isChanged ? 'bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-100' : 'bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-200'}`}
        />
        <AnimatePresence>
          {isChanged && (
            <motion.button 
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              onClick={onSave}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 active:scale-90 transition-all"
            >
              <Save size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DocCard({ title, img, inputRef, onUpload, date, setDate, isBack }: any) {
  return (
    <div className="bg-slate-50 rounded-[2.2rem] p-6 border border-slate-100 hover:border-indigo-200 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h4>
        {img && <CheckCircle size={14} className="text-emerald-500" />}
      </div>
      
      <div className="aspect-[4/3] bg-white rounded-2xl overflow-hidden shadow-inner border border-slate-200/50 relative">
        <img 
          src={img ? `${FILE_BASE_URL}${img}` : 'https://via.placeholder.com/400x300?text=No+Document'} 
          className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
          alt={title} 
        />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
           <button onClick={() => inputRef.current?.click()} className="p-4 bg-white rounded-2xl text-indigo-600 shadow-2xl transform hover:scale-110 active:scale-90 transition-all">
             <Upload size={24} />
           </button>
        </div>
      </div>

      <input ref={inputRef} type="file" hidden accept="image/*" onChange={onUpload} />

      {isBack && (
        <div className="mt-4 space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-black focus:border-indigo-400 outline-none" 
            />
          </div>
        </div>
      )}

      <button 
        onClick={() => inputRef.current?.click()}
        className="w-full mt-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
      >
        {img ? 'Update Image' : 'Upload Proof'}
      </button>
    </div>
  );
}