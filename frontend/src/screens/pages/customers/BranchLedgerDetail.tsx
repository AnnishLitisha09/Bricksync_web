import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Boxes,
  Truck,
  CheckCircle2,
  Plus,
  Loader2,
  MapPin,
  Clock,
  IndianRupee,
  RefreshCw,
  Hash,
  X,
} from "lucide-react";
import {
  fetchBranchDeliveries,
  addBranchDeliveryToStock,
  fetchLoadedMaterials,
  createBranchDelivery,
  type BranchDeliveryLog,
  type CursorLoad,
} from "../../../api/cursor";
import { getAllOffices, getStock } from "../../../api/inventory";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BranchLedgerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [office, setOffice] = useState<any>(null);
  const [logs, setLogs] = useState<BranchDeliveryLog[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Manual delivery modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableLoads, setAvailableLoads] = useState<CursorLoad[]>([]);
  const [formData, setFormData] = useState({
    cursor_load_id: "",
    product_name: "",
    category: "sand",
    quantity: "",
    price: "",
    vehicle_number: "",
    driver_name: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [officesRes, logsRes, stocksRes] = await Promise.all([
        getAllOffices(),
        fetchBranchDeliveries(id),
        getStock(),
      ]);

      const foundOffice = (officesRes.data || []).find(
        (o: any) => String(o.office_id) === String(id)
      );
      setOffice(foundOffice || null);
      setLogs(logsRes.data || []);

      // Filter stocks for this office
      const officeStocks = (stocksRes || []).filter(
        (s: any) => String(s.office_id) === String(id)
      );
      setStocks(officeStocks);
    } catch (err: any) {
      toast.error(err.message || "Failed to load branch details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenAddDelivery = async () => {
    try {
      const loadsRes = await fetchLoadedMaterials();
      setAvailableLoads(loadsRes.data || []);
      setFormData({
        cursor_load_id: "",
        product_name: "",
        category: "sand",
        quantity: "",
        price: "",
        vehicle_number: "",
        driver_name: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setIsModalOpen(true);
    } catch (err: any) {
      toast.error("Failed to load available loads");
    }
  };

  const handleSelectLoad = (loadId: string) => {
    const load = availableLoads.find((l) => String(l.id) === loadId);
    if (load) {
      setFormData({
        ...formData,
        cursor_load_id: loadId,
        product_name: load.product_name,
        category: load.category || "sand",
        quantity: String(load.remaining_qty),
        price: String(load.price_per_qty),
        vehicle_number: load.vehicle_number,
        driver_name: load.driver_name,
        date: load.date || formData.date,
      });
    }
  };

  const handleSubmitDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!formData.product_name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Valid quantity is required");
      return;
    }

    setSubmitting(true);
    try {
      await createBranchDelivery({
        office_id: Number(id),
        cursor_load_id: formData.cursor_load_id ? Number(formData.cursor_load_id) : null,
        product_name: formData.product_name.trim(),
        category: formData.category,
        quantity: Number(formData.quantity),
        price: Number(formData.price) || 0,
        vehicle_number: formData.vehicle_number.trim(),
        driver_name: formData.driver_name.trim(),
        date: formData.date,
        notes: formData.notes || undefined,
      });

      toast.success("Delivery recorded and added to branch stock!");
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToStock = async (logId: number) => {
    try {
      setSyncingId(logId);
      const res = await addBranchDeliveryToStock(logId);
      toast.success(res.message || "Quantity added to stock!");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add to stock");
    } finally {
      setSyncingId(null);
    }
  };

  const totalDeliveredQty = logs.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
  const totalValue = logs.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.price || 0),
    0
  );

  return (
    <div className="space-y-6 font-sans pb-16 max-w-6xl mx-auto">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Directory</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {office?.office_name || `Branch #${id}`}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Branch Office Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                {office?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {office.location}
                  </span>
                )}
                <span>• Material receipts and stock sync history</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="h-10 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-indigo-600" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddDelivery}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Receive Material</span>
          </button>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deliveries</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{logs.length} loads</h3>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received Qty</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{totalDeliveredQty.toLocaleString()} units</h3>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Materials</p>
          <h3 className="text-xl font-black text-indigo-700 mt-1">{stocks.length} items</h3>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Material Value</p>
          <h3 className="text-xl font-black text-emerald-700 mt-1">₹{totalValue.toLocaleString("en-IN")}</h3>
        </div>
      </div>

      {/* ─── CURRENT STOCK PREVIEW ─── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Boxes size={18} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Current Live Inventory at this Branch
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {stocks.length} tracked products
          </span>
        </div>

        {stocks.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No stock currently recorded at this branch.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {stocks.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{s.product_name || `Product #${s.product_id}`}</p>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{s.category || "Stock"}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{Number(s.quantity).toLocaleString()}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">in stock</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── BRANCH DELIVERY LOG (LIKE CUSTOMER LEDGER) ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Branch Delivery Log</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-2" size={26} />
            <p className="text-xs text-slate-400 font-semibold">Loading delivery log...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Truck size={32} className="mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Branch Deliveries Recorded Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When materials are dispatched to this branch from a Cursor or quarry, they will appear here and sync to stock.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Material</th>
                  <th className="py-3 px-5">Vehicle & Driver</th>
                  <th className="py-3 px-5">Source Cursor</th>
                  <th className="py-3 px-5 text-right">Received Qty</th>
                  <th className="py-3 px-5 text-right">Unit Rate (₹)</th>
                  <th className="py-3 px-5 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-5 text-center">Stock Status</th>
                  <th className="py-3 px-5 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => {
                  const lineTotal = Number(log.quantity) * Number(log.price || 0);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-600">{log.date}</td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900">{log.product_name}</p>
                        {log.category && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {log.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-800">{log.vehicle_number || "—"}</p>
                        {log.driver_name && (
                          <p className="text-[11px] text-slate-400">{log.driver_name}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                          {log.cursorLoad?.cursor?.name || "Quarry / Cursor"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-slate-900">
                        {Number(log.quantity).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-700">
                        ₹{Number(log.price || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right font-black text-slate-900">
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        {log.is_added_to_stock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} />
                            <span>Added to Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} />
                            <span>Pending Sync</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleAddToStock(log.id)}
                          disabled={syncingId === log.id}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {syncingId === log.id ? (
                            <Loader2 size={12} className="animate-spin inline" />
                          ) : (
                            "+ Add to Stock"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MANUAL DELIVERY MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
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
                    <h3 className="text-sm font-black text-slate-900">Receive Material at Branch</h3>
                    <p className="text-[10px] text-slate-400 font-bold">{office?.office_name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitDelivery} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Pick from Cursor Load */}
                {availableLoads.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-indigo-700 block mb-1">
                      Pick from Loaded Cursor Material (Optional)
                    </label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-indigo-200 bg-indigo-50/30 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                      value={formData.cursor_load_id}
                      onChange={(e) => handleSelectLoad(e.target.value)}
                    >
                      <option value="">Select from active loaded quarry vehicles...</option>
                      {availableLoads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.cursor?.name} — {l.product_name} ({l.remaining_qty} units on {l.vehicle_number})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Material Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M-Sand, Cement 53 Grade"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Category</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="sand">Sand</option>
                      <option value="cement">Cement</option>
                      <option value="brick">Brick</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Quantity Received <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Unit Rate (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                      <input
                        type="number"
                        step="any"
                        placeholder="0"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Receipt Date</label>
                    <input
                      type="date"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TN 38 AB 1234"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 uppercase"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-[11px] font-medium text-emerald-900">
                    This quantity will automatically be added to the live stock of this branch!
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    <span>Confirm & Add to Stock</span>
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

export default BranchLedgerDetail;
