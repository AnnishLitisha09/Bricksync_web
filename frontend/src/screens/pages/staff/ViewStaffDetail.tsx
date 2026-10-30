import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, Edit3, History, Loader2, User,
  ArrowUpRight, ArrowDownLeft, CalendarDays, ChevronRight,
  CalendarCheck, CalendarRange, ShieldCheck,
  Landmark, Wallet, AlertCircle, X
} from "lucide-react";
import React, { useCallback, useEffect, useState, useMemo } from "react";
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
        setTransactions(transData.data || []);
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

  useEffect(() => {
    if (id) {
      fetchData(1);
      fetchAttendance();
    }
  }, [id, fetchData, fetchAttendance]);

  const monthlyPct = useMemo(() => {
    if (attendance.monthlyTotal === 0) return 0;
    return Math.min(100, Math.round((attendance.monthlyPresent / attendance.monthlyTotal) * 100));
  }, [attendance]);

  const yearlyPct = useMemo(() => {
    if (attendance.yearlyTotal === 0) return 0;
    return Math.min(100, Math.round((attendance.yearlyPresent / attendance.yearlyTotal) * 100));
  }, [attendance]);

  if (loading && !staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FC]">
        <Loader2 className="animate-spin text-indigo-600 mb-3" size={36} />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
          Loading Staff Profile...
        </p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FC] p-4 text-center">
        <AlertCircle size={44} className="text-rose-500 mb-3" />
        <h2 className="text-xl font-black text-slate-800">Staff Member Not Found</h2>
        <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
          The requested personnel profile could not be retrieved from the database.
        </p>
        <button
          onClick={() => navigate("/staff")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-2xs"
        >
          Return to Personnel Hub
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8F9FC] p-4 md:p-8 space-y-6 font-sans text-slate-800 max-w-7xl mx-auto"
    >
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group shrink-0"
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 rounded-full text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
                <ShieldCheck size={11} /> Verified Staff Profile
              </span>
              <span className="text-xs font-bold text-slate-400">
                • Staff ID #{staff.userid}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 truncate">
              {staff.name}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Employment records, salary settlements, advance balance & shift attendance
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Edit3 size={14} className="text-slate-500" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Wallet size={15} />
            <span>Manage Ledger</span>
          </button>
        </div>
      </div>

      {/* ── 4-CARD EXECUTIVE OVERVIEW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: ONBOARDING IDENTITY */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <User size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Personnel Details
            </p>
            <h3 className="text-base font-black text-slate-900 tracking-tight truncate mt-0.5">
              {staff.name}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Joined {new Date(staff.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* CARD 2: REMAINING ADVANCE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Advance Liability
            </p>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                (summary.remainingAdvance || 0) > 0
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {(summary.remainingAdvance || 0) > 0 ? "Pending Due" : "Settled"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              ₹{(summary.remainingAdvance || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-xs font-bold text-slate-400">INR</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Current advance balance outstanding
          </p>
        </div>

        {/* CARD 3: MONTHLY ATTENDANCE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              This Month
            </p>
            <CalendarCheck size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {attendance.monthlyPresent}
                <span className="text-slate-300 text-base font-bold">/{attendance.monthlyTotal}</span>
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {monthlyPct}%
              </span>
            </div>
            <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${monthlyPct}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-2">
            Present days logged in {new Date().toLocaleDateString('en-IN', { month: 'short' })}
          </p>
        </div>

        {/* CARD 4: YEARLY ATTENDANCE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Yearly Score ({new Date().getFullYear()})
            </p>
            <CalendarRange size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
                {attendance.yearlyPresent}
                <span className="text-slate-300 text-base font-bold">/{attendance.yearlyTotal}</span>
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {yearlyPct}%
              </span>
            </div>
            <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${yearlyPct}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-2">
            Cumulative annual attendance rate
          </p>
        </div>
      </div>

      {/* ── PROFILE & ATTENDANCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <DriverInfoCard staff={staff} fileBaseUrl={FILE_BASE_URL} />
        </div>
        <div className="lg:col-span-8">
          <WeeklyAttendance userId={id!} />
        </div>
      </div>

      {/* ── TRANSACTION FLOW & LEDGER ── */}
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Personnel Financial Flow
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                Itemized salary dispatches, advance receipts & expense clearances
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filters */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl text-xs">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0 cursor-pointer"
              />
              <span className="text-slate-300 font-bold">→</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0 cursor-pointer"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear Dates"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(["all", "salary", "advance"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    filter === tab
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab === "all" ? "All" : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Cards List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transactions.length > 0 ? (
              <>
                {transactions.map((t, idx) => {
                  const isSalary = t.category === "salary";
                  const isReceived = t.type === "received";

                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Transaction Icon */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isSalary
                              ? "bg-blue-50 text-blue-600"
                              : isReceived
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-rose-50 text-rose-600"
                          }`}
                        >
                          {isReceived ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSalary
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-purple-50 text-purple-700 border border-purple-100"
                              }`}
                            >
                              {t.category}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                              {t.paymentType || "Cash"}
                            </span>
                            {t.bank?.name && (
                              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                <Landmark size={11} className="text-slate-400" />
                                {t.bank.name}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-1 truncate">
                            {t.description || `${isSalary ? "Salary Payment" : "Advance Settlement"}`}
                          </h4>

                          <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <CalendarDays size={12} />
                            {new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Amount
                        </p>
                        <span
                          className={`text-xl sm:text-2xl font-black tabular-nums ${
                            isSalary
                              ? "text-blue-600"
                              : isReceived
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {isReceived ? "+" : "-"} ₹{t.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={pagination.page === 1}
                        onClick={() => fetchData(pagination.page - 1)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => fetchData(pagination.page + 1)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs text-center"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
                  <History size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Transactions Recorded</h3>
                <p className="text-slate-400 text-xs font-medium max-w-sm mt-1">
                  Salary disbursements and advance payouts recorded in the ledger will show up here.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
                >
                  Record Payment or Advance
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODALS ── */}
      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        staff={staff}
        refresh={fetchData}
      />
      <LedgerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={id!}
        refresh={fetchData}
      />
    </motion.div>
  );
};

export default ViewStaffDetail;
