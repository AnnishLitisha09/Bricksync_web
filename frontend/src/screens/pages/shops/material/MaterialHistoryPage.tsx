import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Search,
  Store,
  CreditCard,
  Download,
  Landmark,
  Pencil,
  Trash2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../../../../api/base";

// NEW COMPONENTS
import SummaryCards from "./components/SummaryCards";
import Pagination from "./components/Pagination";
import EntryModal from "./components/modals/EntryModal";
import PaymentModal from "./components/modals/PaymentModal";
import ExportModal from "./components/modals/ExportModal";

// --- TYPES ---
interface MaterialEntryField {
  field_name: string;
  field_value: string;
}

interface MaterialEntry {
  id: number;
  date: string;
  product_id: number;
  units: string | number;
  amount: string | number;
  product?: { product_name: string };
  office?: { office_name: string };
  fields: MaterialEntryField[];
}

interface MaterialStatement {
  id: number;
  amount: string | number;
  payment_mode: string;
  description: string;
  createdAt: string;
  bank?: { name: string };
}

export default function MaterialHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shopId");
  const shopName = searchParams.get("shopName") || "Merchant Ledger";

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [statements, setStatements] = useState<MaterialStatement[]>([]);
  const [supplier, setSupplier] = useState<any>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingEntry, setEditingEntry] = useState<MaterialEntry | null>(null);
  const [editingStatement, setEditingStatement] = useState<MaterialStatement | null>(null);

  useEffect(() => {
    if (shopId) {
      fetchData();
    }
  }, [shopId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [entriesRes, statementsRes, supplierRes] = await Promise.all([
        fetch(`${BASE_URL}/materials/entries/supplier/${shopId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/materials/statements/supplier/${shopId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${BASE_URL}/materials/suppliers/${shopId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      const entriesData = await entriesRes.json();
      const statementsData = await statementsRes.json();
      const supplierData = await supplierRes.json();

      if (entriesData.success) setEntries(entriesData.data);
      if (statementsData.success) setStatements(statementsData.data);
      if (supplierData.success) setSupplier(supplierData.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'ENTRY' | 'STATEMENT', id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'ENTRY' ? 'procurement entry' : 'payment statement'}? Stock and balances will be reversed.`)) return;

    try {
      const endpoint = type === 'ENTRY' ? `/materials/entries/${id}` : `/materials/statements/${id}`;
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Deleted successfully");
        fetchData();
      } else {
        toast.error(result.message || "Deletion failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const allLogs = useMemo(() => {
    const procurement = entries.map(e => ({
      ...e,
      type: 'ENTRY',
      sortDate: new Date(e.date).getTime()
    }));
    const payments = statements.map(s => ({
      ...s,
      type: 'STATEMENT',
      sortDate: new Date(s.createdAt).getTime()
    }));
    return [...procurement, ...payments].sort((a, b) => b.sortDate - a.sortDate);
  }, [entries, statements]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l: any) => {
      const term = searchTerm.toLowerCase();
      if (l.type === 'ENTRY') {
        return (l as any).product?.product_name.toLowerCase().includes(term);
      }
      return (l as any).payment_mode.toLowerCase().includes(term) || (l as any).description?.toLowerCase().includes(term);
    });
  }, [searchTerm, allLogs]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-8 font-sans"
    >
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate(-1)}
            className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all group"
          >
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
              <Store className="text-indigo-600" size={28} />
              {shopName}
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Material Supply History</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> Export Report
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-100 transition-all"
          >
            <CreditCard size={16} /> Record Payment
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all active:scale-95"
          >
            <Plus size={18} /> New Entry
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <SummaryCards
        supplier={supplier}
        entriesCount={entries.length}
        statementsCount={statements.length}
        onExportClick={() => setIsExportModalOpen(true)}
      />

      {/* TRANSACTION LIST */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg"><Receipt size={18} className="text-indigo-600" /></div>
            Procurement Ledger
          </h3>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-xs w-full sm:w-64"
            />
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Records...</p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100">
              <Search size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No material entries found</p>
            </div>
          ) : (
            paginatedLogs.map((l: any, idx: number) => (
              <div key={`${l.type}-${l.id}`}>
                {l.type === 'ENTRY' ? (
                  <MaterialLogRow
                    log={l}
                    idx={idx}
                    onEdit={() => setEditingEntry(l)}
                    onDelete={() => handleDelete('ENTRY', l.id)}
                  />
                ) : (
                  <StatementRow
                    st={l}
                    idx={idx}
                    onEdit={() => setEditingStatement(l)}
                    onDelete={() => handleDelete('STATEMENT', l.id)}
                  />
                )}
              </div>
            ))
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            label="supply records"
          />
        </div>
      </div>

      {/* MODALS */}
      <EntryModal
        isOpen={isModalOpen || !!editingEntry}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSuccess={fetchData}
        supplierId={shopId || ""}
        predefinedFields={supplier?.additionalFields || []}
        editData={editingEntry}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen || !!editingStatement}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setEditingStatement(null);
        }}
        onSuccess={fetchData}
        supplierId={shopId || ""}
        editData={editingStatement}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        supplier={supplier}
        allLogs={allLogs}
      />
    </motion.div>
  );
}

// --- SUB-COMPONENTS ---
function MaterialLogRow({ log, idx, onEdit, onDelete }: { log: any; idx: number; onEdit: () => void; onDelete: () => void }) {
  const date = new Date(log.date);
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="group bg-white p-2 pr-6 rounded-4xl shadow-sm border border-slate-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 mb-4">
      <div className="w-full md:w-32 h-24 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center group-hover:bg-indigo-100 transition-colors">
        <span className="text-[10px] font-black text-indigo-400 uppercase mb-1">{date.getFullYear()}</span>
        <span className="text-2xl font-black text-indigo-800 leading-none">{date.getDate()}</span>
        <span className="text-[10px] font-black uppercase text-indigo-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{log.product?.product_name || 'Material'}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md border border-slate-200">
              {log.units} Units
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md border border-slate-200">
              @ {log.office?.office_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Procurement</p>
            <span className="text-xl font-black text-slate-900">₹{Number(log.amount).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button onClick={onEdit} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"><Pencil size={14} /></button>
            <button onClick={onDelete} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatementRow({ st, idx, onEdit, onDelete }: { st: any; idx: number; onEdit: () => void; onDelete: () => void }) {
  const date = new Date(st.createdAt);
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} className="bg-white p-2 pr-6 rounded-[2rem] shadow-sm border border-emerald-100 hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-6 mb-4">
      <div className="w-full md:w-32 h-24 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
        <span className="text-[10px] font-black text-emerald-600/50 uppercase mb-1">PAID</span>
        <span className="text-2xl font-black text-emerald-700 leading-none">{date.getDate()}</span>
        <span className="text-[10px] font-black uppercase text-emerald-600 mt-1">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><Landmark size={24} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clearance</h3>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{st.bank?.name || 'Bank'}</p>
                <div className="w-1 h-1 bg-emerald-300 rounded-full" />
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded-md border border-emerald-100">
                  {st.payment_mode || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Settlement</p>
              <span className="text-xl font-black text-emerald-700">₹{Number(st.amount).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={onEdit} className="p-2.5 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl hover:bg-amber-50 transition-all border border-transparent hover:border-amber-100"><Pencil size={14} /></button>
              <button onClick={onDelete} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-transparent hover:border-red-100"><Trash2 size={14} /></button>
            </div>
          </div>
        </div>
        {st.description && (
          <div className="mt-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 italic">"{st.description}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}


