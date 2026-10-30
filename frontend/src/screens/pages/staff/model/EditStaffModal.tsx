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
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-xl overflow-y-auto max-h-[90vh] border border-slate-200/80">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Update Staff Profile</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Edit employee credentials & documentation</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"><X size={16} /></button>
            </div>

            <form className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleUpdateStaff}>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">Full Name</label>
                <input type="text" required value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">Phone Number</label>
                <input type="text" required value={editData.phoneNumber} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">Email Address</label>
                <input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 block">DL Expiry Date</label>
                <input type="date" value={editData.drivingLicenceValidity} onChange={(e) => setEditData({ ...editData, drivingLicenceValidity: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3.5 font-medium text-xs text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20" />
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-3 mt-2">
                <FileUploadBox label="Profile Photo" onChange={(f) => setFiles({ ...files, image: f })} />
                <FileUploadBox label="Aadhar Card" onChange={(f) => setFiles({ ...files, aadhar: f })} />
                <FileUploadBox label="DL Front" onChange={(f) => setFiles({ ...files, drivingLicence: f })} />
                <FileUploadBox label="DL Back" onChange={(f) => setFiles({ ...files, drivingLicenceBack: f })} />
              </div>

              <div className="md:col-span-2 pt-3">
                <button type="submit" disabled={modalLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs">
                  {modalLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
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