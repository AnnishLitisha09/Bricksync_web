import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Edit3,
  History,
  Loader2,
  Plus,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, BASE_URL_NO_API, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import { deobfuscate } from "../../../utils/encryption";
import DriverInfoCard from "../../../components/staff/DriverInfoCard";
import WeeklyAttendance from "../../../components/staff/WeeklyAttendance";
import { useBankStore } from "../../../store/bankStore";
import EditStaffModal from "./model/EditStaffModal";
import LedgerModal from "./model/LedgerModal";

// Separate Modal Components


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

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchBanks } = useBankStore();

  const [staff, setStaff] = useState<APIUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "salary" | "advance">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const realId = deobfuscate(id!);
      const [userRes, transRes] = await Promise.all([
        fetch(`${BASE_URL}/user`, { headers: getAuthHeader() }),
        fetch(`${BASE_URL_NO_API}/api/wallet/transaction?userid=${realId}`, { headers: getAuthHeader() }),
      ]);

      const userData: APIUser[] = await userRes.json();
      const found = userData.find((u) => String(u.userid) === realId);
      if (found) setStaff(found);

      const transData = await transRes.json();
      if (transData.success) setTransactions(transData.data);
    } catch (error) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [id, fetchBanks]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  const remainingAdvance = useMemo(() => {
    return transactions
      .filter((t) => t.category === "advance")
      .reduce((acc, t) => (t.type === "received" ? acc + t.amount : acc - t.amount), 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.category === filter);
  }, [transactions, filter]);

  if (loading || !staff) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50/50 p-4 md:p-10 space-y-10 font-sans text-slate-900 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">{staff.name}</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Staff ID: {staff.userid}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all shadow-sm">
            <Edit3 size={18} /> Edit Profile
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
            <Plus size={18} /> Manage Ledger
          </button>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden">
          <div className="relative z-10 p-5 bg-indigo-50 rounded-3xl text-indigo-600">
            <User size={40} strokeWidth={2.5} />
          </div>
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Onboarding Details</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{staff.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400 font-bold text-xs">Joined: <span className="text-slate-900">{new Date(staff.createdAt).toLocaleDateString()}</span></p>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <p className="text-slate-400 font-bold text-xs">Wallet: <span className="text-indigo-600 font-black">₹{staff.amount?.toLocaleString()}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-rose-500 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform"><ArrowUpRight size={120} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em] opacity-80 mb-2">Remaining Advance</p>
            <p className="text-4xl font-black tabular-nums">₹{remainingAdvance.toLocaleString()}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest italic">Liability</div>
          </div>
        </div>
      </div>

      {/* PROFILE & ATTENDANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <DriverInfoCard staff={staff} fileBaseUrl={FILE_BASE_URL} />
        </div>
        <div className="lg:col-span-8">
          <WeeklyAttendance userId={id!} />
        </div>
      </div>

      {/* TRANSACTION FLOW */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm"><History size={20} className="text-indigo-500" /></div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Transaction Flow</h3>
          </div>
          <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
            {(["all", "salary", "advance"] as const).map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.map((t, idx) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${t.type === "received" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                      {t.type === "received" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.category}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-50 rounded-md">{t.paymentType}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mt-0.5 uppercase italic">{t.description}</h4>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1 uppercase">
                        <CalendarDays size={12} /> {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        <span className="ml-2 text-[10px] text-slate-300">• {t.bank?.name || "Cash"}</span>
                      </p>
                    </div>
                  </div>
                  <p className={`text-2xl font-black tabular-nums ${t.type === "received" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "received" ? "+" : "-"} ₹{t.amount.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* MODALS */}
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