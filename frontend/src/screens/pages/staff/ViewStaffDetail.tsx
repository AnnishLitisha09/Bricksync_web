import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, Edit3, History, Loader2, Plus, User,
  ArrowUpRight, ArrowDownLeft, CalendarDays, ChevronRight,
  CalendarCheck, CalendarRange
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, BASE_URL_NO_API, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { deobfuscate } from "../../../utils/encryption";
import DriverInfoCard from "../../../components/staff/DriverInfoCard";
import WeeklyAttendance from "../../../components/staff/WeeklyAttendance";
import EditStaffModal from "./model/EditStaffModal";
import LedgerModal from "./model/LedgerModal";

export interface APIUser {
  userid: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  amount: number;
  imageUrl: string | null;
  aadharUrl: string | null;
  drivingLicenceUrl: string | null;
  drivingLicenceBackUrl: string | null;
  drivingLicenceValidity: string | null;
  userRole: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  userid: number;
  amount: number;
  type: "sent" | "received";
  category: "salary" | "advance";
  paymentType: string;
  description: string;
  date: string;
  bank?: { name: string; accountNumber: string };
}

interface AttendanceSummary {
  monthlyPresent: number;
  monthlyTotal: number;
  yearlyPresent: number;
  yearlyTotal: number;
}

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<APIUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "salary" | "advance">("all");
  const [summary, setSummary] = useState({ remainingAdvance: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceSummary>({
    monthlyPresent: 0, monthlyTotal: 0, yearlyPresent: 0, yearlyTotal: 0,
  });

  const fetchData = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const realId = deobfuscate(id!);
      let url = `${BASE_URL_NO_API}/api/wallet/transaction?userid=${realId}&page=${pageNum}&category=${filter}`;
      if (startDate && endDate) url += `&startDate=${startDate}&endDate=${endDate}`;

      const [userRes, transRes] = await Promise.all([
        fetch(`${BASE_URL}/user`, { headers: getAuthHeader() }),
        fetch(url, { headers: getAuthHeader() }),
      ]);
      const userData: APIUser[] = await userRes.json();
      const found = userData.find(u => String(u.userid) === realId);
      if (found) setStaff(found);

      const transData = await transRes.json();
      if (transData.success) {
        setTransactions(transData.data);
        setSummary(transData.summary || { remainingAdvance: 0 });
        setPagination(transData.pagination || { page: 1, totalPages: 1, total: 0 });
      }
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [id, filter, startDate, endDate]);

  // Fetch attendance counts
  const fetchAttendance = useCallback(async () => {
    const realId = deobfuscate(id!);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Days in current month / days elapsed in year
    const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.ceil((now.getTime() - startOfYear.getTime()) / 86400000) + 1;

    try {
      const [monRes, yearRes] = await Promise.all([
        fetch(`${BASE_URL}/attendance/monthly-count?userid=${realId}&year=${year}&month=${month}`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL}/attendance/yearly-count?userid=${realId}&year=${year}`, { headers: getAuthHeader() }),
      ]);
      const [monData, yearData] = await Promise.all([monRes.json(), yearRes.json()]);
      setAttendance({
        monthlyPresent: monData.presentDays ?? 0,
        monthlyTotal: daysInMonth,
        yearlyPresent: yearData.presentDays ?? 0,
        yearlyTotal: dayOfYear,
      });
    } catch { /* non-blocking */ }
  }, [id]);

  useEffect(() => { if (id) { fetchData(1); fetchAttendance(); } }, [id, fetchData, fetchAttendance]);

  if (loading || !staff) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FC]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8F9FC] p-4 md:p-8 lg:p-12 space-y-8 font-sans text-slate-900 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors shrink-0">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase truncate max-w-[220px] sm:max-w-none">{staff.name}</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em]">Staff ID: {staff.userid}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition shadow-sm">
            <Edit3 size={16} /> Edit Profile
          </button>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition shadow-lg shadow-slate-200">
            <Plus size={16} /> Manage Ledger
          </button>
        </div>
      </div>

      {/* ── OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Name / Onboarding */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0"><User size={32} strokeWidth={2.5} /></div>
          <div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-0.5">Onboarding Details</p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase truncate max-w-[200px]">{staff.name}</h2>
            <p className="text-slate-400 font-bold text-xs mt-1">Joined: <span className="text-slate-700">{new Date(staff.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></p>
          </div>
        </div>

        {/* Remaining Advance */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute -bottom-3 -right-3 text-white/5 group-hover:scale-110 transition-transform"><ArrowUpRight size={100} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remaining Advance</p>
            <p className="text-3xl sm:text-4xl font-black tabular-nums">₹{summary.remainingAdvance?.toLocaleString('en-IN')}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">Liability</span>
          </div>
        </div>

        {/* Monthly Attendance */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">This Month</p>
            <CalendarCheck size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums leading-none">
              {attendance.monthlyPresent}<span className="text-slate-300 text-xl font-bold">/{attendance.monthlyTotal}</span>
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Days Present</p>
          </div>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${attendance.monthlyTotal > 0 ? (attendance.monthlyPresent / attendance.monthlyTotal) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* ── YEARLY ATTENDANCE BANNER ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0"><CalendarRange size={22} className="text-emerald-600" /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yearly Attendance ({new Date().getFullYear()})</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {attendance.yearlyPresent}<span className="text-slate-300 font-bold text-lg">/{attendance.yearlyTotal}</span>
              <span className="text-emerald-600 text-sm font-black ml-3">{attendance.yearlyTotal > 0 ? Math.round((attendance.yearlyPresent / attendance.yearlyTotal) * 100) : 0}%</span>
            </p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Days present this year</p>
          </div>
        </div>
        <div className="w-full sm:w-64 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${attendance.yearlyTotal > 0 ? (attendance.yearlyPresent / attendance.yearlyTotal) * 100 : 0}%` }} />
        </div>
      </div>

      {/* ── PROFILE & ATTENDANCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-4"><DriverInfoCard staff={staff} fileBaseUrl={FILE_BASE_URL} /></div>
        <div className="lg:col-span-8"><WeeklyAttendance userId={id!} /></div>
      </div>

      {/* ── TRANSACTION FLOW ── */}
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm"><History size={18} className="text-indigo-500" /></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Transaction Flow</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 focus:ring-0" />
              <span className="text-slate-300 text-[10px] font-black">→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 focus:ring-0" />
            </div>
            <div className="flex gap-1.5 p-1.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
              {(["all", "salary", "advance"] as const).map(tab => (
                <button key={tab} onClick={() => setFilter(tab)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-600"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transactions.length > 0 ? (
              <>
                {transactions.map((t, idx) => (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 ${t.category === 'salary' ? "bg-blue-50 text-blue-600" : t.type === 'received' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {t.type === "received" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${t.category === 'salary' ? "text-blue-500" : "text-slate-400"}`}>{t.category}</span>
                            <span className="text-[10px] font-black uppercase text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md">{t.paymentType}</span>
                          </div>
                          <h4 className="text-base font-black text-slate-900 mt-0.5 uppercase">{t.description}</h4>
                          <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-0.5 uppercase">
                            <CalendarDays size={11} /> {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            <span className="text-slate-300">•</span>{t.bank?.name || "Cash"}
                          </p>
                        </div>
                      </div>
                      <p className={`text-xl sm:text-2xl font-black tabular-nums shrink-0 ${t.category === 'salary' ? "text-blue-600" : t.type === 'received' ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.type === "received" ? "+" : "-"} ₹{t.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button disabled={pagination.page === 1} onClick={() => fetchData(pagination.page - 1)} className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 shadow-sm"><ChevronLeft size={18} /></button>
                    <div className="flex gap-2">
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button key={i} onClick={() => fetchData(i + 1)} className={`w-11 h-11 rounded-2xl text-[10px] font-black transition-all ${pagination.page === i + 1 ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"}`}>{i + 1}</button>
                      ))}
                    </div>
                    <button disabled={pagination.page === pagination.totalPages} onClick={() => fetchData(pagination.page + 1)} className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 disabled:opacity-30 shadow-sm"><ChevronRight size={18} /></button>
                  </div>
                )}
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <History size={44} className="text-slate-100 mb-4" />
                <h3 className="text-lg font-black text-slate-300 uppercase">No Transactions Found</h3>
                <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Records appear after payments or advances</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <EditStaffModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} staff={staff} refresh={fetchData} />
      <LedgerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={id!} refresh={fetchData} />
    </motion.div>
  );
};

export default ViewStaffDetail;