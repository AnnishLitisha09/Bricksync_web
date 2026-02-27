import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL, getAuthHeader } from "../../../../api/base";
import type { APIUser } from "../ViewStaffDetail";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staff: APIUser;
  refresh: () => void;
}

const EditStaffModal: React.FC<Props> = ({ isOpen, onClose, staff, refresh }) => {
  const [modalLoading, setModalLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    drivingLicenceValidity: "",
    userRole: "2",
  });
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    image: null,
    aadhar: null,
    drivingLicence: null,
    drivingLicenceBack: null,
  });

  useEffect(() => {
    if (staff) {
      setEditData({
        name: staff.name,
        email: staff.email || "",
        phoneNumber: staff.phoneNumber,
        drivingLicenceValidity: staff.drivingLicenceValidity || "",
        userRole: String(staff.userRole),
      });
    }
  }, [staff]);

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const data = new FormData();
      Object.entries(editData).forEach(([key, val]) => data.append(key, val));
      if (files.image) data.append("image", files.image);
      if (files.aadhar) data.append("aadhar", files.aadhar);
      if (files.drivingLicence) data.append("drivingLicence", files.drivingLicence);
      if (files.drivingLicenceBack) data.append("drivingLicenceBack", files.drivingLicenceBack);

      const res = await fetch(`${BASE_URL}/user/admin/update/${staff.userid}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: data,
      });

      if (res.ok) {
        toast.success("Staff profile updated!");
        onClose();
        refresh();
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic">Update Staff Profile</h2>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full text-slate-400"><X size={24} /></button>
            </div>

            <form className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleUpdateStaff}>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Phone Number</label>
                <input type="text" required value={editData.phoneNumber} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">DL Expiry Date</label>
                <input type="date" value={editData.drivingLicenceValidity} onChange={(e) => setEditData({ ...editData, drivingLicenceValidity: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 font-bold text-slate-800 outline-none" />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-4">
                <FileUploadBox label="Profile Photo" onChange={(f) => setFiles({ ...files, image: f })} />
                <FileUploadBox label="Aadhar Card" onChange={(f) => setFiles({ ...files, aadhar: f })} />
                <FileUploadBox label="DL Front" onChange={(f) => setFiles({ ...files, drivingLicence: f })} />
                <FileUploadBox label="DL Back" onChange={(f) => setFiles({ ...files, drivingLicenceBack: f })} />
              </div>

              <div className="md:col-span-2 pt-6">
                <button type="submit" disabled={modalLoading} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-indigo-100">
                  {modalLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FileUploadBox = ({ label, onChange }: { label: string; onChange: (f: File | null) => void }) => (
  <div className="relative group border-2 border-dashed border-slate-200 rounded-2xl p-4 hover:border-indigo-400 transition-colors bg-slate-50/50">
    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} />
    <div className="flex flex-col items-center gap-2 pointer-events-none">
      <ImageIcon size={20} className="text-slate-400 group-hover:text-indigo-500" />
      <p className="text-[10px] font-black text-slate-500 uppercase">{label}</p>
    </div>
  </div>
);

export default EditStaffModal;