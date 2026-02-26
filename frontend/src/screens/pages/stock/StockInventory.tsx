import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Store,
  CalendarDays,
  X,
  Save,
  Users,
  History,
  HardHat, // Added for cement context
  Pencil,
  Eye,
  Package, // Added for placeholder
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";

import { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";


import { useNavigate } from "react-router-dom";
import AddProductModal from "./AddProductModal";
import {
  getStock,
  getAllOffices,
  getEmployees,
  logProduction,
  deleteStock,
  getTodayProductionStats
} from "../../../api/inventory";
import { FILE_BASE_URL } from "../../../api/base";


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

interface Office {
  office_id: number;
  office_name: string;
}

interface Employee {
  employee_id: number;
  employee_name: string;
}


interface ProductionLog {
  production_id: number;
  production_date: string;
  unit_produced: string;
  cement_used: string;
  product: {
    product_name: string;
    category: string;
  };
  office: {
    office_name: string;
  };
  employees?: {
    employee: {
      name: string;
    };
  }[];
}


export default function StockPage() {
  const navigate = useNavigate();

  // States
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [staffList, setStaffList] = useState<Employee[]>([]);
  const [todayLogs, setTodayLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  // Modal & Selection States
  const [productionModal, setProductionModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ProductStock | null>(null);
  const [productModal, setProductModal] = useState(false);
  const [productionForm, setProductionForm] = useState({
    shopId: "",
    productId: "",
    qty: "",
    cementProductId: "",
    cementBags: "",
    date: new Date().toISOString().split('T')[0], // Default to today
    selectedStaffIds: [] as number[]
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [stockData, officeData, employeeData, todayData] = await Promise.all([
        getStock(),
        getAllOffices(),
        getEmployees(),
        getTodayProductionStats()
      ]);
      setProducts(stockData);
      setOffices(officeData.success ? officeData.data : (Array.isArray(officeData) ? officeData : []));
      setStaffList(employeeData.data ? employeeData.data : (Array.isArray(employeeData) ? employeeData : []));
      setTodayLogs(Array.isArray(todayData) ? todayData : []);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const productionProducts = useMemo(() => {
    return products.filter(p => p.office_id === Number(productionForm.shopId));
  }, [productionForm.shopId, products]);

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

  const cementProducts = useMemo(() => {
    return products
      .filter(p => p.office_id === Number(productionForm.shopId) && p.product.category === "cement")
      .map(p => ({
        product_id: p.product_id,
        product_name: p.product.product_name
      }));
  }, [productionForm.shopId, products]);

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (id && !productionForm.selectedStaffIds.includes(id)) {
      setProductionForm({
        ...productionForm,
        selectedStaffIds: [...productionForm.selectedStaffIds, id]
      });
    }
  };

  const removeStaff = (id: number) => {
    setProductionForm({
      ...productionForm,
      selectedStaffIds: productionForm.selectedStaffIds.filter(s => s !== id)
    });
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productionForm.selectedStaffIds.length === 0) {
      toast.error("Please assign at least one staff member.");
      return;
    }

    const qtyNum = parseFloat(productionForm.qty);
    const cementBagsNum = parseFloat(productionForm.cementBags);

    if (qtyNum <= 0) {
      toast.error("Units produced must be a positive number.");
      return;
    }

    if (cementBagsNum <= 0) {
      toast.error("Cement bags used must be a positive number.");
      return;
    }

    const payload = {
      office_id: Number(productionForm.shopId),
      product_id: Number(productionForm.productId),
      unit_produced: qtyNum,
      cement_used: cementBagsNum,
      cement_product_id: Number(productionForm.cementProductId),
      production_date: productionForm.date,
      employee_ids: productionForm.selectedStaffIds
    };

    console.log("Submitting production with payload:", payload);

    // 🔹 Frontend Validation: Check Cement Stock
    if (productionForm.cementProductId && productionForm.cementBags) {
      const cementInStock = products.find(p =>
        p.product_id === Number(productionForm.cementProductId) &&
        p.office_id === Number(productionForm.shopId)
      );

      const available = cementInStock ? parseFloat(cementInStock.quantity) : 0;
      const required = cementBagsNum;

      if (required > available) {
        toast.error(`Insufficient cement stock! Available: ${available} Bags`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await logProduction(payload);

      toast.success("Production record saved and inventory updated!");
      setProductionModal(false);
      setProductionForm({
        shopId: "",
        productId: "",
        qty: "",
        cementProductId: "",
        cementBags: "",
        date: new Date().toISOString().split('T')[0],
        selectedStaffIds: []
      });
      fetchInitialData(); // Refresh data
    } catch (err) {
      toast.error("Failed to log production. Please check your inputs.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (idToDelete) {
      try {
        setDeleting(true);
        await deleteStock(idToDelete);
        toast.success("Stock record removed");
        setDeleteModal(false);
        setIdToDelete(null);
        fetchInitialData();
      } catch (err) {
        toast.error("Failed to delete stock");
        console.error(err);
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
      className="min-h-screen bg-gray-50/50 p-4 md:p-8 space-y-6 relative"
    >
      {/* TODAY'S PRODUCTION MODAL */}
      <AnimatePresence>
        {productionModal && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <CalendarDays size={24} />
                </div>
                <button onClick={() => setProductionModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Production <span className="text-orange-600">Entry</span></h3>
              <p className="text-slate-500 text-[10px] font-bold mb-4 uppercase tracking-widest">Daily Log for manufacturing units</p>

              <div className="mb-6 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Production Date</label>
                  <input
                    type="date"
                    value={productionForm.date}
                    onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                    className="bg-transparent text-sm font-black text-slate-700 outline-none border-b-2 border-orange-200 focus:border-orange-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm text-orange-600">
                  <CalendarDays size={20} />
                </div>
              </div>

              <form onSubmit={handleProductionSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">1. Store</label>
                    <select
                      required
                      value={productionForm.shopId}
                      onChange={(e) => setProductionForm({ ...productionForm, shopId: e.target.value, productId: "" })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Shop</option>
                      {offices.map(o => (
                        <option key={o.office_id} value={o.office_id}>{o.office_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">2. Units Produced</label>
                    <input
                      required
                      type="number"
                      placeholder="00"
                      value={productionForm.qty}
                      onChange={(e) => setProductionForm({ ...productionForm, qty: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">3. Material</label>
                    <select
                      required
                      disabled={!productionForm.shopId}
                      value={productionForm.productId}
                      onChange={(e) => setProductionForm({ ...productionForm, productId: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    >
                      <option value="">{productionForm.shopId ? "Choose Item" : "Select Store"}</option>
                      {productionProducts
                        .filter(p => p.product.category !== "cement")
                        .map(p => (
                          <option key={p.stock_id} value={p.product_id}>{p.product.product_name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">4. Cement Type</label>
                    <select
                      required
                      disabled={!productionForm.shopId}
                      value={productionForm.cementProductId}
                      onChange={(e) => setProductionForm({ ...productionForm, cementProductId: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    >
                      <option value="">{productionForm.shopId ? "Select Cement" : "Select Store"}</option>
                      {cementProducts.map(p => (
                        <option key={p.product_id} value={p.product_id}>{p.product_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center ml-1 mb-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">5. Cement Bags</label>
                      {productionForm.cementProductId && (
                        <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                          stock: {products.find(p => p.product_id === Number(productionForm.cementProductId) && p.office_id === Number(productionForm.shopId))?.quantity || 0}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        required
                        type="number"
                        placeholder="Qty Used"
                        value={productionForm.cementBags}
                        onChange={(e) => setProductionForm({ ...productionForm, cementBags: e.target.value })}
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">6. Assign Staff</label>
                    <select
                      required
                      onChange={handleStaffSelect}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Staff Members</option>
                      {staffList.map(emp => (
                        <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* STAFF SELECTED LIST */}
                <div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    {productionForm.selectedStaffIds.length === 0 && (
                      <span className="text-[10px] text-red-400 font-black uppercase p-2">* Select at least one staff member</span>
                    )}
                    {productionForm.selectedStaffIds.map(id => {
                      const staff = staffList.find(s => s.employee_id === id);
                      return (
                        <motion.span
                          layout
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          key={id}
                          className="flex items-center gap-1.5 bg-white border border-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm"
                        >
                          <Users size={12} className="text-orange-500" />
                          {staff?.employee_name}
                          <button type="button" onClick={() => removeStaff(id)} className="hover:text-red-500 ml-1">
                            <X size={14} />
                          </button>
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Daily Record</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
            Stock <span className="text-orange-600 italic">Inventory</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight">Manage products and production cycles</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/inventory/history")}
            className="flex items-center justify-center gap-2 bg-white text-slate-800 border-2 border-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500 transition-all active:scale-95 shadow-sm"
          >
            <History size={16} className="text-slate-400" /> History
          </button>
          <button
            onClick={() => {
              setProductionModal(true);
              if (selectedShop !== "all") {
                setProductionForm({ ...productionForm, shopId: selectedShop });
              }
            }}
            className="flex items-center justify-center gap-2 bg-white text-slate-800 border-2 border-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500 transition-all active:scale-95 shadow-sm"
          >
            <CalendarDays size={16} className="text-orange-600" /> Today's Product
          </button>
          <button
            onClick={() => { setSelectedStock(null); setProductModal(true); }}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">Bridging Inventory...</div>
        </div>
      ) : (
        <>

          <div className="bg-white p-4 md:p-5 rounded-3xl md:rounded-4xl shadow-sm border border-gray-100 space-y-4">
            {/* SHOP FILTER - Responsive Horizontal Scroll */}
            <div className="w-full">
              <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar touch-pan-x">
                <div className="flex flex-nowrap min-w-max gap-1">
                  <button
                    onClick={() => setSelectedShop("all")}
                    className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedShop === "all"
                      ? "bg-white text-orange-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    All Stores
                  </button>

                  {offices.map((shop) => (
                    <button
                      key={shop.office_id}
                      onClick={() => setSelectedShop(shop.office_id.toString())}
                      className={`px-5 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedShop === shop.office_id.toString()
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                      {shop.office_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by ID or Product Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none shadow-sm"
              />
            </div>
          </div>

          {/* TODAY'S PRODUCTION LIVE FEED */}
          {todayLogs.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-orange-50/30 rounded-3xl border border-orange-100 overflow-hidden mb-6"
            >
              <div className="p-4 border-b border-orange-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                    <History size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Today&apos;s Production Activity</h4>
                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">{todayLogs.length} Records Logged</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-orange-100 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200">
                {todayLogs.map((log) => (
                  <div key={log.production_id} className="p-4 flex items-center justify-between hover:bg-orange-100/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-orange-100">
                        <Package size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 uppercase">{log.product.product_name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                            <Store size={10} /> {log.office.office_name}
                          </span>
                          <span className="text-[9px] font-bold text-slate-300">•</span>
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                            {log.employees && log.employees.length > 0 ? (
                              <>
                                <Users size={10} /> {log.employees[0].employee.name.split(' ')[0]} {log.employees.length > 1 ? `+${log.employees.length - 1}` : ''}
                              </>
                            ) : 'No Staff'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-orange-600">+{log.unit_produced} {getUnitLabel(log.product.category)}</div>
                      <div className="text-[9px] font-bold text-slate-400">{new Date(log.production_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TABLE DATA */}
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            {/* Horizontal Scroll Wrapper */}
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
              <table className="w-full min-w-[700px]"> {/* min-w ensures the table maintains structure on small screens */}
                <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 md:px-8 py-6 text-left">Product Details</th>
                    <th className="px-6 py-6 text-left">ID</th>
                    <th className="px-6 py-6 text-left">Location</th>
                    <th className="px-6 py-6 text-left">Status</th>
                    <th className="px-6 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedProducts.map((product) => (
                    <tr key={product.stock_id} className="group hover:bg-orange-50/30 transition-colors">
                      <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white flex items-center justify-center">
                            {product.product.image_url ? (
                              <img
                                src={product.product.image_url.startsWith("/images/") ? `${FILE_BASE_URL}${product.product.image_url}` : product.product.image_url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <Package size={20} className="text-slate-200" />
                            )}
                          </div>

                          <div>
                            <div className="font-black text-slate-800 text-sm uppercase">{product.product.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{product.product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-slate-600 font-bold">
                          PROD-{product.product_id}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-bold text-[11px] uppercase text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Store size={14} className="text-orange-500" />
                          {product.office.office_name}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStockStyle(parseFloat(product.quantity))}`}>
                          {parseFloat(product.quantity) === 0 ? "Out of Stock" : `${product.quantity} ${getUnitLabel(product.product.category)}`}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedStock(product); setViewModal(true); }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => { setSelectedStock(product); setProductModal(true); }}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => { setIdToDelete(product.stock_id); setDeleteModal(true); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
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
              <div className="bg-slate-50/50 px-4 md:px-8 py-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} items
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white rounded-xl border border-gray-100 text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none px-2 py-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`flex-shrink-0 w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === page
                          ? "bg-slate-900 text-white shadow-lg"
                          : "bg-white text-slate-400 border border-gray-100 hover:border-orange-500 hover:text-orange-600 shadow-sm"
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white rounded-xl border border-gray-100 text-slate-400 disabled:opacity-30 hover:text-orange-600 transition-all shadow-sm"
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
      <AnimatePresence>
        {viewModal && selectedStock && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-2xl"
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
                <div className="bg-gray-50 rounded-4xl p-2 aspect-video flex items-center justify-center border border-gray-100 overflow-hidden mb-2 shadow-inner">
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
        )}
      </AnimatePresence>
      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-4xl p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Are you sure?</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">This action cannot be undone</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteModal(false)}
                  className="py-4 bg-gray-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="animate-spin" size={16} /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT MODAL (ADD/EDIT) */}
      <AddProductModal
        isOpen={productModal}
        onClose={() => { setProductModal(false); setSelectedStock(null); }}
        onSuccess={fetchInitialData}
        editData={selectedStock}
      />
    </motion.div>
  );
}
