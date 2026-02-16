import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Calendar, User, Mail, Phone, 
  CreditCard, ShieldCheck, Clock, ArrowUpRight, ArrowDownLeft,
  FileText, Download, IndianRupee, MapPin
} from "lucide-react";

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- Mock Data (Mirroring your AddDriverPage schema) ---
  const driver = {
    name: "Rahul Kumar",
    email: "rahul.k@logistics.com",
    phoneNumber: "+91 98765 43210",
    baseSalary: "25,000",
    licenseValidity: "2028-12-31",
    status: "Active",
    joinedDate: "Oct 12, 2024",
    documents: [
      { name: "Aadhar Card", status: "Verified" },
      { name: "Driving License", status: "Verified" }
    ]
  };

  const payments = [
    { id: 1, date: "2026-02-10", mode: "UPI", amount: "5,000", type: "Received", ref: "TXN9901" },
    { id: 2, date: "2026-02-01", mode: "Bank Transfer", amount: "20,000", type: "Sent", ref: "TXN8820" },
    { id: 3, date: "2026-01-15", mode: "Cash", amount: "1,200", type: "Received", ref: "CASH_02" },
  ];

  // --- Attendance State ---
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const [attendance, setAttendance] = useState(
    days.map((day) => ({ day, fn: false, an: false }))
  );

  const toggleAttendance = (index: number, shift: "fn" | "an") => {
    const updated = [...attendance];
    updated[index][shift] = !updated[index][shift];
    setAttendance(updated);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 space-y-8">
      
      {/* 1. TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Driver Profile</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              UID: <span className="text-indigo-600 font-bold">{id?.toUpperCase() || "DRV-7721"}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              Joined {driver.joinedDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all">
                Edit Details
            </button>
            <button className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Generate Report
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 2. LEFT COLUMN: PERSISTENT INFO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 relative">
                <User size={64} className="text-slate-200" />
                <div className="absolute -bottom-2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  {driver.status}
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">{driver.name}</h2>
                <p className="text-slate-400 font-bold text-sm">Logistics Partner</p>
              </div>
            </div>

            <div className="mt-10 space-y-2">
              <InfoRow icon={<Mail size={16}/>} label="Email" value={driver.email} />
              <InfoRow icon={<Phone size={16}/>} label="Phone" value={driver.phoneNumber} />
              <InfoRow icon={<IndianRupee size={16}/>} label="Base Salary" value={`₹${driver.baseSalary}`} />
              <InfoRow icon={<ShieldCheck size={16}/>} label="DL Validity" value={driver.licenseValidity} />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification Docs</p>
               <div className="grid grid-cols-2 gap-3">
                  {driver.documents.map((doc, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-2xl flex flex-col gap-1">
                        <FileText size={16} className="text-indigo-500" />
                        <span className="text-xs font-bold text-slate-700">{doc.name}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase">{doc.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* 3. RIGHT COLUMN: ATTENDANCE & PAYMENTS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Attendance Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Clock size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Weekly Attendance</h3>
              </div>
              
              {/* Week Switcher */}
              <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button 
                   onClick={() => setCurrentWeekOffset(o => o - 1)}
                   className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Feb 16 - Feb 22</span>
                </div>
                <button 
                  onClick={() => setCurrentWeekOffset(o => o + 1)}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-2">Day</th>
                    <th className="px-6 py-2 text-center">Forenoon</th>
                    <th className="px-6 py-2 text-center">Afternoon</th>
                    <th className="px-6 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row, index) => (
                    <tr key={row.day} className="bg-slate-50/50 hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 rounded-l-2xl font-bold text-slate-700">{row.day}</td>
                      <td className="px-6 py-4 text-center">
                        <AttendanceCheckbox checked={row.fn} onChange={() => toggleAttendance(index, "fn")} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <AttendanceCheckbox checked={row.an} onChange={() => toggleAttendance(index, "an")} />
                      </td>
                      <td className="px-6 py-4 rounded-r-2xl text-right">
                        <StatusBadge fn={row.fn} an={row.an} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
              Save Weekly Records
            </button>
          </div>

          {/* Payment Logs Section */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CreditCard size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Payment History</h3>
              </div>
              <button className="text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:underline">View All</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-3">Sl.No</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Mode</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pay, idx) => (
                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{pay.date}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Ref: {pay.ref}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                          {pay.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`font-black ${pay.type === 'Sent' ? 'text-blue-600' : 'text-amber-600'}`}>
                          ₹{pay.amount}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1 font-black text-[9px] uppercase px-3 py-1 rounded-full ${
                          pay.type === 'Received' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {pay.type === 'Received' ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                          {pay.type}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- SHARED UI COMPONENTS --- */

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
    <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="font-bold text-slate-700">{value}</p>
    </div>
  </div>
);

const AttendanceCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`mx-auto w-6 h-6 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${
      checked ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100" : "border-slate-200 bg-white"
    }`}
  >
    {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
  </div>
);

const StatusBadge = ({ fn, an }: { fn: boolean, an: boolean }) => {
  if (fn && an) return <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md text-emerald-600 bg-emerald-50">Full Day</span>;
  if (fn || an) return <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md text-amber-600 bg-amber-50">Half Day</span>;
  return <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md text-slate-300 bg-slate-100">Absent</span>;
};

export default ViewStaffDetail;