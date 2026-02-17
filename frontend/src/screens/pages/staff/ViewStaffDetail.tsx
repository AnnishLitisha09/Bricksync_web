import {
  ChevronLeft,
  Loader2,
  Save,
  Wallet,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  HandCoins,
  Filter
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from "../../../api/base";
import toast, { Toaster } from "react-hot-toast";
import DriverInfoCard from "../../../components/staff/DriverInfoCard";
import WeeklyAttendance from "../../../components/staff/WeeklyAttendance";

interface APIUser {
  userid: number;
  name: string;
  email: string | null;
  phoneNumber: string;
  amount: number; 
  imageUrl: string | null;
  drivingLicenceValidity: string | null;
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: "sent" | "received";
  description: string;
  category: "salary" | "advance";
}

const ViewStaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [staff, setStaff] = useState<APIUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "salary" | "advance">("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [mode, setMode] = useState<"salary" | "advance">("salary");
  const [formData, setFormData] = useState({
    amount: "",
    type: "received", 
    description: "",
    date: new Date().toISOString().split('T')[0],
    bankName: "",
    paymentType: "UPI"
  });

  const fetchStaffData = useCallback(async () => {
    try {
      const userRes = await fetch(`${BASE_URL}/user`, { headers: getAuthHeader() });
      const userData: APIUser[] = await userRes.json();
      const found = userData.find((u) => String(u.userid) === id);
      setStaff(found || null);

      // Simulated transaction data with categories
      setTransactions([
        { id: 1, date: "2026-02-10", amount: 5000, type: "received", description: "Monthly Salary - Feb", category: "salary" },
        { id: 2, date: "2026-02-12", amount: 2000, type: "received", description: "Home Advance", category: "advance" },
        { id: 3, date: "2026-02-15", amount: 500, type: "sent", description: "Advance Deduction", category: "advance" },
      ]);
    } catch (error) {
      toast.error("Failed to load staff details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchStaffData();
  }, [id, fetchStaffData]);

  // Calculations for remaining advance
  const remainingAdvance = useMemo(() => {
    return transactions
      .filter(t => t.category === "advance")
      .reduce((acc, t) => t.type === "received" ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter(t => t.category === filter);
  }, [transactions, filter]);

  const handleModeChange = (newMode: "salary" | "advance") => {
    setMode(newMode);
    setFormData(prev => ({
      ...prev,
      type: newMode === "salary" ? "received" : prev.type 
    }));
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return toast.error("Enter valid amount");
    if (!formData.bankName) return toast.error("Please select a bank");
    
    setModalLoading(true);
    try {
      const payload = {
        userid: Number(id),
        ...formData,
        category: mode,
        amount: Number(formData.amount),
      };

      const res = await fetch(`${BASE_URL}/wallet/transaction`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`${mode.toUpperCase()} entry saved`);
        setIsModalOpen(false);
        resetForm();
        fetchStaffData();
      } else throw new Error();
    } catch {
      toast.error("Transaction failed");
    } finally {
      setModalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      type: "received",
      description: "",
      date: new Date().toISOString().split('T')[0],
      bankName: "",
      paymentType: "UPI"
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  if (!staff) return <div className="p-20 text-center font-bold text-slate-400">Staff not found</div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-4 md:p-10 space-y-10 font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={24}/>
          </button>
          <div>
            <h1 className="text-4xl font-black tracking-tight">{staff.name}</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Staff Member ID: {staff.userid}</p>
          </div>
        </div>

        {/* Remaining Advance Card */}
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-5">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200">
            <HandCoins size={24} />
          </div>
          <div>
            <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Outstanding Advance</p>
            <h4 className="text-2xl font-black text-rose-600">₹{remainingAdvance.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <DriverInfoCard staff={staff} fileBaseUrl={FILE_BASE_URL} />
        </div>
        <div className="lg:col-span-8">
          <WeeklyAttendance userId={id!} />
        </div>
      </div>

      {/* Ledger Section */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Wallet size={24} /></div>
            <h3 className="text-2xl font-black tracking-tight">Financial Ledger</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Filter Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {(['all', 'salary', 'advance'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === opt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
            >
              <Plus size={16} /> Manage Amount
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">
                <th className="px-6">Ref</th>
                <th className="px-6">Details</th>
                <th className="px-6 text-center">Category</th>
                <th className="px-6 text-center">Type</th>
                <th className="px-6 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="bg-slate-50/30 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5 rounded-l-2xl font-bold text-slate-400 text-xs">#{t.id}</td>
                  <td className="px-6 py-5 font-bold text-sm">
                    {t.description}
                    <div className="text-[10px] text-slate-400 uppercase mt-1">{t.date}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter bg-slate-100 px-2 py-1 rounded-md">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      t.type === 'received' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {t.type === 'received' ? <ArrowDownLeft size={10}/> : <ArrowUpRight size={10}/>}
                      {t.type === 'received' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className={`px-6 py-5 rounded-r-2xl text-right font-black text-sm ${
                    t.type === 'received' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {t.type === 'received' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No records found for this filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Manage Amount</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Financial Entry</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>

            {/* Category Toggle */}
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
              <button 
                type="button"
                onClick={() => handleModeChange("salary")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <Banknote size={16} /> Salary
              </button>
              <button 
                type="button"
                onClick={() => handleModeChange("advance")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${mode === 'advance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                <HandCoins size={16} /> Advance
              </button>
            </div>

            <form onSubmit={handleTransaction} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Bank Name</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold focus:outline-indigo-500 appearance-none"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  >
                    <option value="">Select Bank</option>
                    <option value="SBI">SBI</option>
                    <option value="HDFC">HDFC</option>
                    <option value="ICICI">ICICI</option>
                    <option value="Axis">Axis Bank</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Payment Method</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold focus:outline-indigo-500 appearance-none"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                  >
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Amount (₹)</label>
                  <input 
                    type="number" required placeholder="0.00" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold focus:outline-indigo-500" 
                    value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Date</label>
                  <input 
                    type="date" required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold focus:outline-indigo-500" 
                    value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Entry Type</label>
                {mode === "salary" ? (
                  <div className="w-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500 py-4 rounded-2xl text-center font-black text-xs uppercase tracking-widest">
                    Salary Credit (+)
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'received'})} 
                      className={`py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${formData.type === 'received' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'text-slate-400 border-slate-100'}`}
                    >
                      Add Advance (+)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, type: 'sent'})} 
                      className={`py-4 rounded-2xl font-black text-xs uppercase border-2 transition-all ${formData.type === 'sent' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'text-slate-400 border-slate-100'}`}
                    >
                      Less Advance (-)
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Description</label>
                <input 
                  type="text" placeholder="e.g. Weekly settlement or Fuel advance" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold focus:outline-indigo-500" 
                  value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={modalLoading} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
              >
                {modalLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
                Confirm {mode} Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStaffDetail;