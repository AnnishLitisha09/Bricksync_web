import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Trash2,
  Store,
  CalendarDays,
  X,
  History,
  Pencil,
  Eye,
  Package, // Added for placeholder
  ChevronLeft,
  ChevronRight,
  Loader2,
  FlaskConical
} from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";


import { useNavigate } from "react-router-dom";
import AddProductModal from "./AddProductModal";
import ProductionEntryModal from "./ProductionEntryModal";
import { FILE_BASE_URL } from "../../../api/base";
import { useStockStore } from "../../../store/useStockStore";


// Interfaces
interface ProductStock {
  stock_id: number;
  product_id: number;
  office_id: number;
  quantity: string;
  product: {
    product_name: string;
    category: string;
    image_url: string;
    description: string;
  };
  office: {
    office_name: string;
  };
}


export default function StockPage() {
  const navigate = useNavigate();

  // Zustand store
  const { stock: products, offices, loading, fetchStockData, deleteStock } = useStockStore();

  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal & Selection States
  const [productionModal, setProductionModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ProductStock | null>(null);
  const [productModal, setProductModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchStockData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.product.product_name.toLowerCase().includes(search.toLowerCase()) ||
        p.product_id.toString().includes(search.toLowerCase());
      const matchesShop = selectedShop === "all" || p.office_id === Number(selectedShop);
      return matchesSearch && matchesShop;
    });
  }, [search, selectedShop, products]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedShop]);

  const handleDelete = async () => {
    if (idToDelete) {
      try {
        setDeleting(true);
        await deleteStock(idToDelete); // store handles invalidation + refetch
        toast.success("Stock record removed");
        setDeleteModal(false);
        setIdToDelete(null);
      } catch (err) {
        toast.error("Failed to delete stock");
      } finally {
        setDeleting(false);
      }
    }
  };


  const getStockStyle = (qty: number) => {
    if (qty === 0) return "bg-red-100 text-red-700 border-red-200";
    if (qty < 10) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getUnitLabel = (category: string) => {
    switch (category.toLowerCase()) {
      case "cement": return "Bags";
      case "sand": return "Units";
      default: return "Nos";
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 animate-in font-sans"
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Stock <span className="text-indigo-600">Inventory</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Manage manufacturing inventory, stock levels & production logs</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={() => navigate("/production/mix-ratio")}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            title="Configure Plant BOM & 1-Brick Ratios"
          >
            <FlaskConical size={14} className="text-indigo-600" />
            <span>Mix Ratios</span>
          </button>
          <button
            onClick={() => navigate("/inventory/history")}
            className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <History size={15} className="text-slate-400" />
            <span>History</span>
          </button>
          <button
            onClick={() => setProductionModal(true)}
            className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <CalendarDays size={15} className="text-indigo-600" />
            <span>Today's Production</span>
          </button>
          <button
            onClick={() => { setSelectedStock(null); setProductModal(true); }}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Bridging Inventory...</div>
        </div>
      ) : (
        <>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-2xs border border-slate-200/80 space-y-3">
            {/* SHOP FILTER - Responsive Horizontal Scroll */}
            <div className="w-full">
              <div className="flex bg-slate-100/80 p-1 rounded-xl overflow-x-auto no-scrollbar touch-pan-x">
                <div className="flex flex-nowrap min-w-max gap-1">
                  <button
                    onClick={() => setSelectedShop("all")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${selectedShop === "all"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    All Stores
                  </button>

                  {offices.map((shop) => (
                    <button
                      key={shop.office_id}
                      onClick={() => setSelectedShop(shop.office_id.toString())}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${selectedShop === shop.office_id.toString()
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                    >
                      {shop.office_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by ID or Product Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* TABLE DATA */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden">
            {/* Horizontal Scroll Wrapper */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50/60 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Product Details</th>
                    <th className="px-6 py-4 text-left">ID</th>
                    <th className="px-6 py-4 text-left">Location</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedProducts.map((product) => (
                    <tr key={product.stock_id} className="group hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-white flex items-center justify-center">
                            {product.product.image_url ? (
                              <img
                                src={product.product.image_url.startsWith("/images/") ? `${FILE_BASE_URL}${product.product.image_url}` : product.product.image_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Package size={18} className="text-slate-300" />
                            )}
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-tight">{product.product.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">{product.product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold border border-slate-200/60">
                          PROD-{product.product_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-xs uppercase text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-indigo-600" />
                          {product.office.office_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStockStyle(parseFloat(product.quantity))}`}>
                          {parseFloat(product.quantity) === 0 ? "Out of Stock" : `${product.quantity} ${getUnitLabel(product.product.category)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedStock(product); setViewModal(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 cursor-pointer"
                            title="View Stock"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => { setSelectedStock(product); setProductModal(true); }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 cursor-pointer"
                            title="Edit Stock"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => { setIdToDelete(product.stock_id); setDeleteModal(true); }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                            title="Delete Stock"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50/50 px-4 md:px-6 py-3 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center md:text-left">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none px-1 py-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex-shrink-0 w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === page
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 shadow-2xs"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 disabled:opacity-30 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-2xs cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW MODAL */}
      {viewModal && selectedStock && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-slate-200/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Eye size={24} />
                </div>
                <button onClick={() => setViewModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedStock.product.product_name}</h3>
              <p className="text-slate-500 text-[10px] font-bold mb-6 uppercase tracking-widest">{selectedStock.product.category} Inventory Detail</p>

              <div className="space-y-4">
                {/* Product Image Preview */}
                <div className="bg-gray-50 rounded-2xl p-2 aspect-video flex items-center justify-center border border-gray-100 overflow-hidden mb-2 shadow-inner">
                  {selectedStock.product.image_url ? (
                    <img
                      src={selectedStock.product.image_url.startsWith("/images/") ? `${FILE_BASE_URL}${selectedStock.product.image_url}` : selectedStock.product.image_url}
                      className="w-full h-full object-cover rounded-2xl"
                      alt={selectedStock.product.product_name}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} className="text-slate-200" />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Image Provided</span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-xl font-black text-slate-800">{selectedStock.quantity} {getUnitLabel(selectedStock.product.category)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <Store size={14} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">{selectedStock.office.office_name}</p>
                  </div>
                </div>
                {selectedStock.product.description && (
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-sm text-slate-600 font-medium">{selectedStock.product.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl text-center border border-slate-200/80"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">This action cannot be undone</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal(false)}
                  className="py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold uppercase text-[11px] tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-3.5 bg-red-600 text-white rounded-xl font-bold uppercase text-[11px] tracking-wider hover:bg-red-700 shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? <Loader2 className="animate-spin" size={16} /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* PRODUCTION ENTRY MODAL */}
      <ProductionEntryModal
        isOpen={productionModal}
        onClose={() => setProductionModal(false)}
        onSuccess={() => fetchStockData(true)}
      />

      {/* PRODUCT MODAL (ADD/EDIT) */}
      <AddProductModal
        isOpen={productModal}
        onClose={() => { setProductModal(false); setSelectedStock(null); }}
        onSuccess={() => fetchStockData(true)}
        editData={selectedStock}
      />
    </motion.div>
  );
}
