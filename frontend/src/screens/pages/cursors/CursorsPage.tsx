import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Plus,
  Truck,
  Building2,
  Calendar,
  IndianRupee,
  Hash,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  ArrowRight,
  X,
  Loader2,
  PackageCheck,
  User,
  MapPin,
  Phone,
  Boxes,
} from "lucide-react";
import {
  fetchCursors,
  createCursor,
  updateCursor,
  deleteCursor,
  addCursorProduct,
  createCursorLoad,
  type CursorItem,
} from "../../../api/cursor";
import { fetchVehicles } from "../../../api/vehicle";
import { getEmployees } from "../../../api/inventory";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CursorsPage: React.FC = () => {
  const navigate = useNavigate();

  const [cursors, setCursors] = useState<CursorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [isCursorModalOpen, setIsCursorModalOpen] = useState(false);
  const [editingCursor, setEditingCursor] = useState<CursorItem | null>(null);
  const [cursorFormData, setCursorFormData] = useState({
    name: "",
    location: "",
    phone: "",
    notes: "",
  });
  const [submittingCursor, setSubmittingCursor] = useState(false);

  // Selected cursor for detail view
  const [selectedCursor, setSelectedCursor] = useState<CursorItem | null>(null);

  // Add Product modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productFormData, setProductFormData] = useState({
    product_name: "",
    category: "sand",
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Loading Modal
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState({
    cursor_product_id: "",
    product_name: "",
    category: "sand",
    vehicle_id: "",
    vehicle_number: "",
    driver_id: "",
    driver_name: "",
    qty: "",
    price_per_qty: "",
    has_loading_charge: false,
    loading_charge_per_unit: "",
    customer_name: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submittingLoad, setSubmittingLoad] = useState(false);

  // Options for vehicles & employees
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCursors();
      if (res.success) {
        setCursors(res.data);
        if (selectedCursor) {
          const updated = res.data.find((c) => c.id === selectedCursor.id);
          if (updated) setSelectedCursor(updated);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load cursors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    Promise.all([fetchVehicles(), getEmployees()])
      .then(([vRes, eRes]) => {
        setVehicles(vRes || []);
        setEmployees(eRes.data || []);
      })
      .catch(() => {});
  }, []);

  const filteredCursors = cursors.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.location && c.location.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  // Calculate totals
  const totalCursors = cursors.length;
  const totalActiveLoads = cursors.reduce((sum, c) => sum + (c.activeLoadedCount || 0), 0);
  const totalActiveQty = cursors.reduce((sum, c) => sum + Number(c.activeLoadedQty || 0), 0);
  const totalLoadsCount = cursors.reduce((sum, c) => sum + (c.totalLoadsCount || 0), 0);

  /* --- CURSOR HANDLERS --- */
  const handleOpenAddCursor = () => {
    setEditingCursor(null);
    setCursorFormData({ name: "", location: "", phone: "", notes: "" });
    setIsCursorModalOpen(true);
  };

  const handleOpenEditCursor = (c: CursorItem) => {
    setEditingCursor(c);
    setCursorFormData({
      name: c.name,
      location: c.location || "",
      phone: c.phone || "",
      notes: c.notes || "",
    });
    setIsCursorModalOpen(true);
  };

  const handleSubmitCursor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursorFormData.name.trim()) {
      toast.error("Cursor name is required");
      return;
    }
    setSubmittingCursor(true);
    try {
      if (editingCursor) {
        await updateCursor(editingCursor.id, cursorFormData);
        toast.success("Cursor updated!");
      } else {
        await createCursor(cursorFormData);
        toast.success("Cursor added successfully!");
      }
      setIsCursorModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmittingCursor(false);
    }
  };

  const handleDeleteCursor = async (c: CursorItem) => {
    if (!window.confirm(`Are you sure you want to delete cursor "${c.name}"?`)) return;
    try {
      await deleteCursor(c.id);
      toast.success("Cursor deleted");
      if (selectedCursor?.id === c.id) setSelectedCursor(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  /* --- PRODUCT HANDLERS --- */
  const handleOpenAddProduct = (cursor: CursorItem) => {
    setSelectedCursor(cursor);
    setProductFormData({ product_name: "", category: "sand" });
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCursor) return;
    if (!productFormData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSubmittingProduct(true);
    try {
      await addCursorProduct(selectedCursor.id, {
        product_name: productFormData.product_name.trim(),
        category: productFormData.category,
      });
      toast.success("Product added to cursor!");
      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    } finally {
      setSubmittingProduct(false);
    }
  };

  /* --- LOADING HANDLERS --- */
  const handleOpenLoadingModal = (cursor: CursorItem) => {
    setSelectedCursor(cursor);
    const firstProduct = cursor.products && cursor.products.length > 0 ? cursor.products[0] : null;
    setLoadingFormData({
      cursor_product_id: firstProduct ? String(firstProduct.id) : "",
      product_name: firstProduct ? firstProduct.product_name : "",
      category: firstProduct ? firstProduct.category : "sand",
      vehicle_id: "",
      vehicle_number: "",
      driver_id: "",
      driver_name: "",
      qty: "",
      price_per_qty: "",
      has_loading_charge: false,
      loading_charge_per_unit: "",
      customer_name: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setIsLoadingModalOpen(true);
  };

  const handleSubmitLoading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCursor) return;
    if (!loadingFormData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!loadingFormData.vehicle_number.trim()) {
      toast.error("Vehicle number is required");
      return;
    }
    if (!loadingFormData.driver_name.trim()) {
      toast.error("Driver name is required");
      return;
    }
    if (!loadingFormData.qty || Number(loadingFormData.qty) <= 0) {
      toast.error("Valid quantity is required");
      return;
    }
    if (!loadingFormData.price_per_qty || Number(loadingFormData.price_per_qty) < 0) {
      toast.error("Valid buy price per quantity is required");
      return;
    }

    setSubmittingLoad(true);
    try {
      await createCursorLoad(selectedCursor.id, {
        cursor_product_id: loadingFormData.cursor_product_id
          ? Number(loadingFormData.cursor_product_id)
          : null,
        product_name: loadingFormData.product_name.trim(),
        category: loadingFormData.category,
        vehicle_id: loadingFormData.vehicle_id ? Number(loadingFormData.vehicle_id) : null,
        vehicle_number: loadingFormData.vehicle_number.trim(),
        driver_id: loadingFormData.driver_id ? Number(loadingFormData.driver_id) : null,
        driver_name: loadingFormData.driver_name.trim(),
        qty: Number(loadingFormData.qty),
        price_per_qty: Number(loadingFormData.price_per_qty),
        has_loading_charge: loadingFormData.has_loading_charge,
        loading_charge_per_unit: loadingFormData.has_loading_charge
          ? Number(loadingFormData.loading_charge_per_unit || 0)
          : 0,
        customer_name: loadingFormData.customer_name ? loadingFormData.customer_name.trim() : null,
        date: loadingFormData.date,
        notes: loadingFormData.notes || undefined,
      });

      toast.success("Vehicle load recorded with status: Loaded!");
      setIsLoadingModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record loading");
    } finally {
      setSubmittingLoad(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16 max-w-7xl mx-auto">
      {/* ─── HEADER & METRICS ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers size={22} />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cursors</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Quarry & Procurement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buy material (e.g. M-Sand) at quarry price, load vehicles, and dispatch to customers or branches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/customer/add-material/new")}
            className="h-10 px-4 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Truck size={15} className="text-indigo-600" />
            <span>Go to Dispatch</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddCursor}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Cursor</span>
          </button>
        </div>
      </div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cursors</p>
            <h3 className="text-xl font-black text-slate-900">{totalCursors}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ready to Deliver</p>
            <h3 className="text-xl font-black text-amber-700">{totalActiveLoads} loads</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loaded Material</p>
            <h3 className="text-xl font-black text-slate-900">{totalActiveQty.toLocaleString()} units</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <PackageCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Loads</p>
            <h3 className="text-xl font-black text-slate-900">{totalLoadsCount}</h3>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search cursors by name, location, phone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs font-bold text-slate-400">
          {filteredCursors.length} {filteredCursors.length === 1 ? "Cursor" : "Cursors"}
        </span>
      </div>

      {/* ─── CURSOR CARDS GRID ─── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-xs font-semibold text-slate-400">Loading Cursors...</p>
        </div>
      ) : filteredCursors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Layers size={30} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Cursors Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? "No cursors match your search query." : "Add your first cursor (e.g. ASB Blue Material, CC Blue Material) to start recording purchases and loadings."}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleOpenAddCursor}
              className="mt-5 h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add First Cursor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCursors.map((cursor) => (
            <div
              key={cursor.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    onClick={() => navigate(`/cursors/${cursor.id}`)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      {cursor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {cursor.name}
                      </h3>
                      {cursor.location && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={11} className="shrink-0" />
                          <span>{cursor.location}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCursor(cursor)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Edit Cursor"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCursor(cursor)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Cursor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Products</span>
                    <span className="text-xs font-black text-slate-800">{cursor.productsCount || 0} items</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100/80">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Ready to Dispatch</span>
                    <span className="text-xs font-black text-amber-800">{cursor.activeLoadedCount || 0} loads</span>
                  </div>
                </div>

                {cursor.phone && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                    <Phone size={12} className="text-slate-400" />
                    <span>{cursor.phone}</span>
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/cursors/${cursor.id}`)}
                  className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLoadingModal(cursor)}
                  className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Make a vehicle load at this cursor"
                >
                  <Truck size={14} />
                  <span>Loading</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD / EDIT CURSOR MODAL ─── */}
      <AnimatePresence>
        {isCursorModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={18} />
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingCursor ? "Edit Cursor" : "Add New Cursor"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCursorModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitCursor} className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Cursor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASB Blue Material, CC Blue Material"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={cursorFormData.name}
                    onChange={(e) => setCursorFormData({ ...cursorFormData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Location / Quarry Site</label>
                  <input
                    type="text"
                    placeholder="e.g. Karamadai Quarry, Thoppampatti"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={cursorFormData.location}
                    onChange={(e) => setCursorFormData({ ...cursorFormData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={cursorFormData.phone}
                    onChange={(e) => setCursorFormData({ ...cursorFormData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific instructions or contact person..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={cursorFormData.notes}
                    onChange={(e) => setCursorFormData({ ...cursorFormData, notes: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCursorModalOpen(false)}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCursor}
                    className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingCursor && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingCursor ? "Update Cursor" : "Save Cursor"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── ADD PRODUCT MODAL (Product Name & Category Alone) ─── */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Boxes size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Add Product</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{selectedCursor?.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M-Sand, P-Sand, 40mm Blue Metal"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={productFormData.product_name}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, product_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer bg-white"
                    value={productFormData.category}
                    onChange={(e) =>
                      setProductFormData({ ...productFormData, category: e.target.value })
                    }
                  >
                    <option value="sand">Sand (M-Sand, P-Sand, River Sand)</option>
                    <option value="cement">Cement</option>
                    <option value="brick">Brick / Blocks</option>
                    <option value="other">Other Raw Material</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct}
                    className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {submittingProduct && <Loader2 size={14} className="animate-spin" />}
                    <span>Save Product</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── LOADING MODAL (Vehicle Loading at Cursor) ─── */}
      <AnimatePresence>
        {isLoadingModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Truck size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Record Vehicle Loading</h3>
                    <p className="text-[10px] text-slate-400 font-bold">At Cursor: {selectedCursor?.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLoadingModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitLoading} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* 1. Vehicle Number & Driver */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Vehicle Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        list="cursor_vehicles_list"
                        placeholder="Search / enter vehicle..."
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 uppercase"
                        value={loadingFormData.vehicle_number}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const matched = vehicles.find(
                            (v) => v.vehicleNumber?.toUpperCase() === val
                          );
                          setLoadingFormData({
                            ...loadingFormData,
                            vehicle_number: val,
                            vehicle_id: matched ? String(matched.id) : loadingFormData.vehicle_id,
                          });
                        }}
                      />
                      <datalist id="cursor_vehicles_list">
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.vehicleNumber}>
                            {v.vehicleName}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Driver Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="cursor_drivers_list"
                      placeholder="Search / enter driver..."
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      value={loadingFormData.driver_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = employees.find((emp) => emp.employee_name === val);
                        setLoadingFormData({
                          ...loadingFormData,
                          driver_name: val,
                          driver_id: matched ? String(matched.employee_id) : loadingFormData.driver_id,
                        });
                      }}
                    />
                    <datalist id="cursor_drivers_list">
                      {employees.map((emp) => (
                        <option key={emp.employee_id} value={emp.employee_name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* 2. Material Dropdown (shows materials added under this cursor) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-500 block">
                      Material <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCursor) handleOpenAddProduct(selectedCursor);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      + Add New Product
                    </button>
                  </div>
                  <select
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer bg-white"
                    value={loadingFormData.cursor_product_id}
                    onChange={(e) => {
                      const prodId = e.target.value;
                      const selected = selectedCursor?.products?.find((p) => String(p.id) === prodId);
                      setLoadingFormData({
                        ...loadingFormData,
                        cursor_product_id: prodId,
                        product_name: selected ? selected.product_name : "",
                        category: selected ? selected.category : "sand",
                      });
                    }}
                  >
                    <option value="">Select Material from Cursor...</option>
                    {selectedCursor?.products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Qty & Price per Qty */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Quantity Loaded <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={loadingFormData.qty}
                        onChange={(e) =>
                          setLoadingFormData({ ...loadingFormData, qty: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Buy Price / Qty (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 400"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={loadingFormData.price_per_qty}
                        onChange={(e) =>
                          setLoadingFormData({ ...loadingFormData, price_per_qty: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Optional Loading Charge */}
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={loadingFormData.has_loading_charge}
                      onChange={(e) =>
                        setLoadingFormData({
                          ...loadingFormData,
                          has_loading_charge: e.target.checked,
                          loading_charge_per_unit: e.target.checked ? loadingFormData.loading_charge_per_unit : "",
                        })
                      }
                    />
                    <span className="text-xs font-bold text-slate-700">Loading Charge (Optional)</span>
                  </label>

                  {loadingFormData.has_loading_charge && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-1"
                    >
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Loading Charge per Unit (₹)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 5"
                          className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          value={loadingFormData.loading_charge_per_unit}
                          onChange={(e) =>
                            setLoadingFormData({
                              ...loadingFormData,
                              loading_charge_per_unit: e.target.value,
                            })
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 5. Date & Optional Customer Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Loading Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="date"
                        required
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={loadingFormData.date}
                        onChange={(e) =>
                          setLoadingFormData({ ...loadingFormData, date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Customer (Optional)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="text"
                        placeholder="Assigned client if known"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={loadingFormData.customer_name}
                        onChange={(e) =>
                          setLoadingFormData({ ...loadingFormData, customer_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Backend Status indicator */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] font-medium text-amber-900">
                    This load will automatically be saved with status:{" "}
                    <span className="font-black text-amber-800 uppercase">"LOADED"</span>, ready to be dispatched from{" "}
                    <span className="font-bold underline cursor-pointer" onClick={() => navigate("/customer/add-material/new")}>
                      Customer Material Entry
                    </span>.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsLoadingModalOpen(false)}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLoad}
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingLoad && <Loader2 size={14} className="animate-spin" />}
                    <span>Save Loading</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CursorsPage;
