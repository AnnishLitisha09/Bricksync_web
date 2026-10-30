import React, { useState } from "react";
import { Mail, Phone, ShieldCheck, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const dlStatus = () => {
    if (!staff.drivingLicenceValidity) return { label: "Not Specified", color: "bg-slate-100 text-slate-600" };
    const expiry = new Date(staff.drivingLicenceValidity);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "Expired", color: "bg-rose-50 text-rose-700 border border-rose-100" };
    if (diffDays <= 30) return { label: `Expiring (${diffDays}d)`, color: "bg-amber-50 text-amber-700 border border-amber-100" };
    return { label: "Valid & Active", color: "bg-emerald-50 text-emerald-700 border border-emerald-100" };
  };

  const status = dlStatus();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs text-center flex flex-col justify-between h-full">
      <div>
        {/* Profile Avatar */}
        <div className="relative w-32 h-32 mx-auto">
          <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-100 border-2 border-slate-200/80 shadow-2xs flex items-center justify-center">
            {staff.imageUrl ? (
              <img
                src={`${fileBaseUrl}${staff.imageUrl}`}
                className="w-full h-full object-cover"
                alt={staff.name}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white font-black text-3xl">
                {(staff.name || "A").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full border-2 border-white shadow-2xs" title="Verified Workforce">
            <ShieldCheck size={14} />
          </span>
        </div>

        {/* Name & Badge */}
        <div className="mt-4">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {staff.name}
          </h3>
          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
            Registered Personnel
          </span>
        </div>

        {/* Contact Information Cards */}
        <div className="mt-6 space-y-2.5 text-left">
          {/* Phone */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition-all group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors shrink-0">
                <Phone size={14} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Mobile Number
                </p>
                <a
                  href={`tel:${staff.phoneNumber}`}
                  className="font-bold text-slate-800 text-xs hover:text-indigo-600 transition-colors truncate block"
                >
                  {staff.phoneNumber || "Not Available"}
                </a>
              </div>
            </div>
            {staff.phoneNumber && (
              <button
                onClick={() => copyToClipboard(staff.phoneNumber, "Phone number")}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
                title="Copy phone"
              >
                {copiedField === "Phone number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition-all group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors shrink-0">
                <Mail size={14} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Email Address
                </p>
                <a
                  href={`mailto:${staff.email}`}
                  className="font-bold text-slate-800 text-xs hover:text-indigo-600 transition-colors truncate block"
                >
                  {staff.email || "No Email Recorded"}
                </a>
              </div>
            </div>
            {staff.email && (
              <button
                onClick={() => copyToClipboard(staff.email || "", "Email")}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
                title="Copy email"
              >
                {copiedField === "Email" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            )}
          </div>

          {/* Driving Licence Expiry */}
          <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-500 shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Driver's Licence
                </p>
                <p className="font-bold text-slate-800 text-xs">
                  {staff.drivingLicenceValidity
                    ? new Date(staff.drivingLicenceValidity).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Not Specified"}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-slate-400 text-[11px] font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck size={13} className="text-indigo-600" />
        <span>KYC & Biometrics On File</span>
      </div>
    </div>
  );
};

export default DriverInfoCard;
