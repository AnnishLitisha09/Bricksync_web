import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Loader2,
  ExternalLink,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet
} from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import toast, { Toaster } from "react-hot-toast";

// --- Interfaces ---
interface APIUser {
  userid: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  amount: number; // Driver's current balance
  imageUrl: string | null;
  aadharUrl: string | null;
  drivingLicenceUrl: string | null;
  drivingLicenceBackUrl: string | null;
  drivingLicenceValidity: string | null;
  userRole: number;
  createdAt: string;
}

interface AttendanceRecord {
  day: string;
  date: string;
  fn: boolean;
  an: boolean;
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: "sent" | "received";
  description: string;
}

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [staff, setStaff] = useState<APIUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- Date Helpers ---
  const getStartOfWeek = useCallback((offset: number) => {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + (offset * 7);
    return new Date(date.setDate(diff));
  }, []);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch User Detail
        const userRes = await fetch(`${BASE_URL}/user`, { headers: getAuthHeader() });
        const userData: APIUser[] = await userRes.json();
        const found = userData.find((u) => String(u.userid) === id);
        setStaff(found || null);

        // Mocking Transactions (Replace with your actual API call)
        // const transRes = await fetch(`${BASE_URL}/transactions?userid=${id}`, { headers: getAuthHeader() });
        // const transData = await transRes.json();
        setTransactions([
          { id: 1, date: "2026-02-10", amount: 5000, type: "received", description: "Weekly Salary" },
          { id: 2, date: "2026-02-12", amount: 200, type: "sent", description: "Fuel Advance" },
          { id: 3, date: "2026-02-15", amount: 1500, type: "received", description: "Incentive" },
        ]);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // --- Attendance Sync ---
  useEffect(() => {
    const fetchWeeklyAttendance = async () => {
      if (!id) return;
      const start = getStartOfWeek(currentWeekOffset);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      try {
        const res = await fetch(
          `${BASE_URL}/attendance/weekly?userid=${id}&start=${formatDate(start)}&end=${formatDate(end)}`,
          { headers: getAuthHeader() }
        );
        const remoteData = await res.json();

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const weeklyRecords = days.map((dayName, idx) => {
          const d = new Date(start);
          d.setDate(d.getDate() + idx);
          const dateStr = formatDate(d);
          const record = remoteData.find((r: any) => r.date.split('T')[0] === dateStr);
          return { day: dayName, date: dateStr, fn: record ? record.forenoon : false, an: record ? record.afternoon : false };
        });
        setAttendance(weeklyRecords);
      } catch (error) {
        console.error("Attendance fetch error:", error);
      }
    };
    fetchWeeklyAttendance();
  }, [id, currentWeekOffset, getStartOfWeek]);

  const toggleAttendance = (index: number, shift: "fn" | "an") => {
    const updated = [...attendance];
    updated[index][shift] = !updated[index][shift];
    setAttendance(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    const loadingToast = toast.loading("Saving attendance...");
    try {
      const res = await fetch(`${BASE_URL}/attendance/save`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ userid: Number(id), records: attendance.map(rec => ({ date: rec.date, forenoon: rec.fn, afternoon: rec.an })) })
      });
      if (res.ok) toast.success("Attendance synced successfully!", { id: loadingToast });
      else throw new Error();
    } catch (error) {
      toast.error("Save failed", { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD]">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
    </div>
  );

  if (!staff) return <div className="p-20 text-center">User not found</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-10 space-y-10 font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-5">
        <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{staff.name}</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">DRIVER ID: {staff.userid}</p>
        </div>
      </div>

      {/* Main Grid: Profile & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex flex-col items-center mb-8">
               <div className="w-40 h-40 bg-slate-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-sm flex items-center justify-center">
                {staff.imageUrl ? <img src={`${FILE_BASE_URL}${staff.imageUrl}`} className="w-full h-full object-cover" alt="Staff" /> : <User size={60} className="text-slate-200" />}
              </div>
              <div className="mt-6 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Balance</p>
                <h2 className="text-3xl font-black text-indigo-600">₹{staff.amount.toLocaleString()}</h2>
              </div>
            </div>
            <div className="space-y-4">
              <InfoRow icon={<Mail size={18} />} label="Email" value={staff.email || "N/A"} />
              <InfoRow icon={<Phone size={18} />} label="Phone" value={staff.phoneNumber} />
              <InfoRow icon={<ShieldCheck size={18} />} label="DL Expiry" value={staff.drivingLicenceValidity ? new Date(staff.drivingLicenceValidity).toLocaleDateString() : "N/A"} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">Weekly Attendance</h3>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <button onClick={() => setCurrentWeekOffset(o => o - 1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16}/></button>
                <span className="text-[10px] font-black text-slate-500 uppercase px-2">Week Offset: {currentWeekOffset}</span>
                <button onClick={() => setCurrentWeekOffset(o => o + 1)} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-slate-300 uppercase text-left tracking-widest">
                    <th className="px-6 py-2">Day</th>
                    <th className="px-6 py-2 text-center">FN</th>
                    <th className="px-6 py-2 text-center">AN</th>
                    <th className="px-6 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row, index) => (
                    <tr key={row.date} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 rounded-l-2xl font-bold text-slate-700">{row.day} <span className="text-[10px] text-slate-400 font-normal ml-2">{row.date}</span></td>
                      <td><AttendanceCheckbox checked={row.fn} onChange={() => toggleAttendance(index, "fn")} /></td>
                      <td><AttendanceCheckbox checked={row.an} onChange={() => toggleAttendance(index, "an")} /></td>
                      <td className="px-6 py-4 rounded-r-2xl text-right"><StatusBadge fn={row.fn} an={row.an} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Records
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Wallet size={24} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Transaction history & Balance</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Driver Balance</p>
            <p className="text-3xl font-black text-slate-900">₹{staff.amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <th className="px-6 py-2 text-left">Sl.No</th>
                <th className="px-6 py-2 text-left">Date</th>
                <th className="px-6 py-2 text-left">Description</th>
                <th className="px-6 py-2 text-center">Status</th>
                <th className="px-6 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={t.id} className="bg-slate-50/30 hover:bg-slate-50 transition-all group">
                  <td className="px-6 py-5 rounded-l-2xl font-bold text-slate-400 text-xs">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-6 py-5 font-bold text-slate-700 text-sm">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Ref ID: TXN-{t.id}992</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      t.type === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {t.type === 'received' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {t.type}
                    </span>
                  </td>
                  <td className={`px-6 py-5 rounded-r-2xl text-right font-black text-sm ${t.type === 'received' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'received' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- UI Subcomponents --- */
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-3 bg-slate-50/50 rounded-2xl">
    <div className="text-slate-400">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
      <p className="font-bold text-slate-700 text-sm mt-1">{value}</p>
    </div>
  </div>
);

const AttendanceCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div onClick={onChange} className={`mx-auto w-6 h-6 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${checked ? "bg-indigo-600 border-indigo-600" : "border-slate-200 bg-white"}`}>
    {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
  </div>
);

const StatusBadge: React.FC<{ fn: boolean; an: boolean }> = ({ fn, an }) => {
  if (fn && an) return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-emerald-50 text-emerald-600">Present</span>;
  if (fn || an) return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-amber-50 text-amber-600">Half Day</span>;
  return <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-slate-100 text-slate-300">Absent</span>;
};

const DocLink: React.FC<{ label: string; url: string | null }> = ({ label, url }) => (
  <a href={url ? `${FILE_BASE_URL}${url}` : "#"} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-4 rounded-2xl border ${url ? 'bg-white border-slate-100' : 'bg-slate-50 opacity-50 cursor-not-allowed'}`}>
    <span className="text-xs font-bold text-slate-700">{label}</span>
    {url && <ExternalLink size={14} className="text-slate-300" />}
  </a>
);

export default ViewStaffDetail;