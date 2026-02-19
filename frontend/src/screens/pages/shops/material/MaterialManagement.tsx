import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Plus,
  Search,
  Store,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// NEW COMPONENTS
import MerchantCard from "./components/MerchantCard";
import MerchantModal from "./components/modals/MerchantModal";
import CategoryFilter from "./components/CategoryFilter";
import DeleteConfirmationModal from "./components/modals/DeleteConfirmationModal";
import Pagination from "./components/Pagination";

// --- INTERFACES ---
interface ShopEntry {
  id: number;
  shop_name: string;
  owner_name: string;
  phone_no: string;
  address: string;
  category: string;
  balance: string | number;
  createdAt: string;
}


export default function ShopLedgerPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ShopEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setEntries(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingShopId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/materials/suppliers/${deletingShopId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        toast.success("Merchant deleted successfully");
        fetchSuppliers();
        setDeletingShopId(null);
      } else {
        toast.error(result.message || "Failed to delete merchant");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const [editingShop, setEditingShop] = useState<ShopEntry | null>(null);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [deletingShopId, setDeletingShopId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const categories = ["ALL", "Retail", "Wholesale", "Distributor", "Contractor"];

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return entries.filter((s) => {
      const matchSearch =
        s.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === "ALL" || s.category.toUpperCase() === activeCategory.toUpperCase();
      return matchSearch && matchCategory;
    });
  }, [entries, searchTerm, activeCategory]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  // Navigation Handler
  const handleViewHistory = (shop: ShopEntry) => {
    navigate(`/shop/materials/history?shopId=${shop.id}&shopName=${encodeURIComponent(shop.shop_name)}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-10 font-sans"
    >
      <Toaster position="top-right" />

      {/* GLOSSY HEADER SECTION */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Store className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              SHOP <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-500 italic">LEDGER</span>
            </h1>
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] pl-1">Merchant Credit Directory</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="backdrop-blur-md border border-slate-200 rounded-2xl py-3.5 pl-12 pr-6 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-bold text-slate-600 w-full md:w-72"
            />
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${showFilter ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter size={16} />
            Filter
          </button>

          <button
            onClick={() => {
              setEditingShop(null);
              setIsMerchantModalOpen(true);
            }}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-300 hover:bg-indigo-600 hover:shadow-indigo-200 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Register Merchant
          </button>
        </div>
      </div>

      <CategoryFilter
        show={showFilter}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* CONTENT AREA */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Merchants...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="popLayout">
              {paginatedEntries.map((shop, idx) => (
                <MerchantCard
                  key={shop.id}
                  shop={shop}
                  idx={idx}
                  onViewHistory={handleViewHistory}
                  onEdit={(s) => {
                    setEditingShop(s);
                    setIsMerchantModalOpen(true);
                  }}
                  onDelete={setDeletingShopId}
                />
              ))}
            </AnimatePresence>

            <MerchantModal
              isOpen={isMerchantModalOpen}
              onClose={() => {
                setIsMerchantModalOpen(false);
                setEditingShop(null);
              }}
              shop={editingShop}
              onSuccess={fetchSuppliers}
            />

            <DeleteConfirmationModal
              isOpen={!!deletingShopId}
              onClose={() => setDeletingShopId(null)}
              onConfirm={confirmDelete}
              title="Delete Merchant"
              message="Are you sure you want to remove this merchant? This action cannot be undone and will only proceed if there are no existing transactions."
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEntries.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              label="merchants"
            />

            {filteredEntries.length === 0 && (
              <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-slate-100 italic">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No merchants found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
