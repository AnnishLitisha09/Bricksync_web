import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Search,
  Store,
  CreditCard,
  Download
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

// NEW COMPONENTS
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
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
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/entries/supplier/${shopId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/statements/supplier/${shopId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers/${shopId}`, {
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
      const endpoint = type === 'ENTRY' ? `/api/materials/entries/${id}` : `/api/materials/statements/${id}`;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${endpoint}`, {
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

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <TransactionTable
            logs={paginatedLogs}
            loading={loading}
            onEdit={(l) => {
              if (l.type === 'ENTRY') setEditingEntry(l);
              else setEditingStatement(l);
            }}
            onDelete={handleDelete}
          />

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

