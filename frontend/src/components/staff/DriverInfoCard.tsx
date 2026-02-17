import React from "react";
import { Mail, Phone, ShieldCheck, User } from "lucide-react";

interface DriverInfoCardProps {
  staff: {
    name: string;
    email: string | null;
    phoneNumber: string;
    amount: number;
    imageUrl: string | null;
    drivingLicenceValidity: string | null;
  };
  fileBaseUrl: string;
}

const DriverInfoCard: React.FC<DriverInfoCardProps> = ({ staff, fileBaseUrl }) => {
  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm text-center">
      {/* Profile Image */}
      <div className="w-40 h-40 mx-auto bg-slate-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-sm flex items-center justify-center">
        {staff.imageUrl ? (
          <img 
            src={`${fileBaseUrl}${staff.imageUrl}`} 
            className="w-full h-full object-cover" 
            alt={staff.name} 
          />
        ) : (
          <User size={60} className="text-slate-200" />
        )}
      </div>

      {/* Wallet Balance */}
      <div className="mt-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Available Balance
        </p>
        <h2 className="text-3xl font-black text-indigo-600">
          ₹{staff.amount.toLocaleString()}
        </h2>
      </div>

      {/* Info Rows */}
      <div className="mt-8 space-y-3 text-left">
        <InfoRow 
          icon={<Mail size={16} />} 
          label="Email Address" 
          value={staff.email || "No Email Provided"} 
        />
        <InfoRow 
          icon={<Phone size={16} />} 
          label="Phone Number" 
          value={staff.phoneNumber} 
        />
        <InfoRow 
          icon={<ShieldCheck size={16} />} 
          label="DL Expiry" 
          value={staff.drivingLicenceValidity || "N/A"} 
        />
      </div>
    </div>
  );
};

// Internal Helper for rows
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-4 p-3.5 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
    <div className="text-slate-400 bg-white p-2 rounded-lg shadow-sm group-hover:text-indigo-600 transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="font-bold text-slate-700 text-sm">{value}</p>
    </div>
  </div>
);

export default DriverInfoCard;