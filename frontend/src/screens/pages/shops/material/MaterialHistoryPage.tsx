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
  Trash2,
  Building2,
  Package,
  Layers,
  CheckCircle2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "../../../../api/base";

// SUB COMPONENTS
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
  const [activeTab, setActiveTab] = useState<"ALL" | "ENTRY" | "STATEMENT">("ALL");
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

      if (entriesData.success) setEntries(entriesData.data || []);
      if (statementsData.success) setStatements(statementsData.data || []);
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

  const totalProcurementAmount = useMemo(() => {
    return entries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [entries]);

  const totalPaidAmount = useMemo(() => {
    return statements.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [statements]);

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
      // Tab filter
      if (activeTab !== "ALL" && l.type !== activeTab) {
        return false;
      }

      // Search filter
      const term = searchTerm.toLowerCase();
      if (!term) return true;

      if (l.type === 'ENTRY') {
        const prod = (l as any).product?.product_name?.toLowerCase() || '';
        const off = (l as any).office?.office_name?.toLowerCase() || '';
        const fieldsStr = (l as any).fields?.map((f: any) => `${f.field_name} ${f.field_value}`).join(' ').toLowerCase() || '';
        return prod.includes(term) || off.includes(term) || fieldsStr.includes(term);
      } else {
        const mode = (l as any).payment_mode?.toLowerCase() || '';
        const desc = (l as any).description?.toLowerCase() || '';
        const bank = (l as any).bank?.name?.toLowerCase() || '';
        return mode.includes(term) || desc.includes(term) || bank.includes(term);
      }
    });
  }, [searchTerm, activeTab, allLogs]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8F9FC] p-4 md:p-8 space-y-6 font-sans text-slate-800"
    >
      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 rounded-full text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
                <Store size={11} /> Merchant Procurement Ledger
              </span>
              <span className="text-xs font-bold text-slate-400">
                • ID: #{shopId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {shopName}
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Procurement orders, material intake logs & payment clearance records
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Statement</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="h-10 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <CreditCard size={14} className="text-emerald-600" />
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>New Procurement</span>
          </button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <SummaryCards
        supplier={supplier}
        entriesCount={entries.length}
        statementsCount={statements.length}
        totalProcurementAmount={totalProcurementAmount}
        totalPaidAmount={totalPaidAmount}
        onExportClick={() => setIsExportModalOpen(true)}
        onPaymentClick={() => setIsPaymentModalOpen(true)}
      />

      {/* ── TRANSACTION LIST & CONTROLS ── */}
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => { setActiveTab("ALL"); setCurrentPage(1); }}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Records ({allLogs.length})
            </button>
            <button
              onClick={() => { setActiveTab("ENTRY"); setCurrentPage(1); }}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "ENTRY"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50"
              }`}
            >
              <Package size={13} />
              Procurements ({entries.length})
            </button>
            <button
              onClick={() => { setActiveTab("STATEMENT"); setCurrentPage(1); }}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "STATEMENT"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
              }`}
            >
              <CreditCard size={13} />
              Payments ({statements.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search by material, mode, bank..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-slate-200/80 bg-slate-50/50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mt-3">
                Loading Records...
              </p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
                <Receipt size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Transactions Found</h3>
              <p className="text-slate-400 font-medium text-xs max-w-sm mt-1">
                {searchTerm
                  ? "No records matched your search query. Try clearing your filters."
                  : "No procurement logs or payments recorded for this merchant yet."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  Clear Search Filter
                </button>
              )}
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

          {/* Pagination */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              label="ledger transactions"
            />
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
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

// ── SUB-COMPONENT: PROCUREMENT ENTRY ROW ──
function MaterialLogRow({ log, idx, onEdit, onDelete }: { log: any; idx: number; onEdit: () => void; onDelete: () => void }) {
  const date = new Date(log.date);
  const formattedDay = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const formattedDate = date.getDate();
  const formattedMonth = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-start sm:items-center gap-4">
        {/* Date Box */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-100/70 transition-colors">
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider leading-none">
            {formattedDay}
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-900 leading-none my-0.5 tabular-nums">
            {formattedDate}
          </span>
          <span className="text-[9px] font-bold uppercase text-indigo-600 leading-none">
            {date.toLocaleDateString('en-IN', { month: 'short' })}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
              <Package size={11} /> Procurement
            </span>
            {log.office?.office_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                <Building2 size={11} /> {log.office.office_name}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">
              {formattedMonth}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
            {log.product?.product_name || 'Raw Material Order'}
          </h3>

          <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              <Layers size={11} className="text-slate-500" />
              {Number(log.units).toLocaleString()} Units
            </span>

            {/* Custom Field Tags */}
            {log.fields && log.fields.map((f: any, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100 text-[11px]">
                <span className="text-slate-400 font-bold">{f.field_name}:</span> {f.field_value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Procurement Value
          </p>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            ₹{Number(log.amount).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            title="Edit Entry"
            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            title="Delete Entry"
            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-rose-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── SUB-COMPONENT: SETTLEMENT / PAYMENT STATEMENT ROW ──
function StatementRow({ st, idx, onEdit, onDelete }: { st: any; idx: number; onEdit: () => void; onDelete: () => void }) {
  const date = new Date(st.createdAt);
  const formattedDay = date.toLocaleDateString('en-IN', { weekday: 'short' });
  const formattedDate = date.getDate();
  const formattedMonth = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-start sm:items-center gap-4">
        {/* Date Box */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center shrink-0 group-hover:bg-emerald-100/70 transition-colors">
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider leading-none">
            {formattedDay}
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-900 leading-none my-0.5 tabular-nums">
            {formattedDate}
          </span>
          <span className="text-[9px] font-bold uppercase text-emerald-700 leading-none">
            {date.toLocaleDateString('en-IN', { month: 'short' })}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
              <CheckCircle2 size={11} /> Settled Payment
            </span>
            {st.bank?.name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                <Landmark size={11} /> {st.bank.name}
              </span>
            )}
            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-black uppercase rounded-md border border-slate-200">
              {st.payment_mode || 'Cash'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {formattedMonth}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors truncate">
            Supplier Settlement Clearance
          </h3>

          {st.description && (
            <p className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block">
              Note: <span className="text-slate-700 font-semibold">{st.description}</span>
            </p>
          )}
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
        <div className="text-left md:text-right">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
            Amount Paid
          </p>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            -₹{Number(st.amount).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            title="Edit Payment"
            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-indigo-100"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            title="Delete Payment"
            className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-rose-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
