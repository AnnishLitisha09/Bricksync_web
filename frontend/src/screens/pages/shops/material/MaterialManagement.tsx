import { AnimatePresence } from "framer-motion";
import {
  Filter,
  Plus,
  Search,
  ChevronLeft
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import MerchantCard from "./components/MerchantCard";
import MerchantModal from "./components/modals/MerchantModal";
import CategoryFilter from "./components/CategoryFilter";
import DeleteConfirmationModal from "./components/modals/DeleteConfirmationModal";
import Pagination from "./components/Pagination";
import { useMaterialStore } from "../../../../store/useMaterialStore";

export default function ShopLedgerPage() {
  const navigate = useNavigate();
  const { suppliers, loading, fetchSuppliers, deleteSupplier } = useMaterialStore();

  const [editingShop, setEditingShop] = useState<typeof suppliers[0] | null>(null);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const categories = ["ALL", "Retail", "Wholesale", "Distributor", "Contractor"];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredEntries = useMemo(() => {
    return suppliers.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        s.shop_name.toLowerCase().includes(term) ||
        s.owner_name.toLowerCase().includes(term) ||
        (s.phone_no && s.phone_no.toLowerCase().includes(term)) ||
        (s.gst_number && s.gst_number.toLowerCase().includes(term)) ||
        (s.tags && s.tags.toLowerCase().includes(term));
      const matchCategory = activeCategory === "ALL" || s.category.toUpperCase() === activeCategory.toUpperCase();
      return matchSearch && matchCategory;
    });
  }, [suppliers, searchTerm, activeCategory]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  const confirmDelete = async () => {
    if (!deletingShopId) return;
    try {
      await deleteSupplier(deletingShopId);
      toast.success("Merchant deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete merchant");
    } finally {
      setDeletingShopId(null);
    }
  };

  const handleViewHistory = (shop: typeof suppliers[0]) => {
    navigate(`/shop/materials/history?shopId=${shop.id}&shopName=${encodeURIComponent(shop.shop_name)}`);
  };

  return (
    <div className="space-y-6 animate-in font-sans">
      <Toaster position="top-right" />

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ChevronLeft size={12} /> Partner Network
            </button>
            <span className="text-xs font-bold text-slate-400">• {suppliers.length} Material Vendors</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Material <span className="text-indigo-600">Suppliers</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Raw material vendors, wholesale dealers & statement reconciliation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <input
              type="text"
              placeholder="Search merchants, GST, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-2xs w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`h-10 px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              showFilter
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>

          <button
            onClick={() => { setEditingShop(null); setIsMerchantModalOpen(true); }}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Register Merchant</span>
          </button>
        </div>
      </div>

      <CategoryFilter
        show={showFilter}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* ─── CONTENT ─── */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Material Merchants...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {paginatedEntries.map((shop, idx) => (
                <MerchantCard
                  key={shop.id}
                  shop={shop}
                  idx={idx}
                  onViewHistory={handleViewHistory}
                  onEdit={(s) => { setEditingShop(s); setIsMerchantModalOpen(true); }}
                  onDelete={setDeletingShopId}
                />
              ))}
            </AnimatePresence>

            {filteredEntries.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-slate-400 font-bold text-sm">No material merchants found</p>
                <p className="text-slate-400 text-xs mt-1">Try refining your search keyword or category filter</p>
              </div>
            )}
          </div>
        )}

        <MerchantModal
          isOpen={isMerchantModalOpen}
          onClose={() => { setIsMerchantModalOpen(false); setEditingShop(null); }}
          shop={editingShop}
          onSuccess={() => fetchSuppliers(true)}
        />

        <DeleteConfirmationModal
          isOpen={!!deletingShopId}
          onClose={() => setDeletingShopId(null)}
          onConfirm={confirmDelete}
          title="Delete Merchant"
          message="Are you sure you want to remove this merchant? This action cannot be undone and will only proceed if there are no existing transactions."
        />

        {!loading && totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEntries.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              label="merchants"
            />
          </div>
        )}
      </div>
    </div>
  );
}
