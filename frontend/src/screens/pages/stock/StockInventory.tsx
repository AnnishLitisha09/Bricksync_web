import { AnimatePresence, motion } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Boxes,
  TrendingDown,
  Info,
  Store,
  CalendarDays,
  X,
  Save,
  Users,
  History,
  HardHat // Added for cement context
} from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Interfaces
interface Product {
  id: string;
  name: string;
  qty: number;
  image: string;
  description: string;
  category: string;
  shopId: string;
}

// Mock Staff Data
const STAFF_LIST = ["Alex Johnson", "Sarah Smith", "Mike Ross", "Harvey Specter", "Donna Paulsen"];

export default function StockPage() {
  const navigate = useNavigate();
  
  // States
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState("all");
  
  // Modal States
  const [productionModal, setProductionModal] = useState(false);
  const [productionForm, setProductionForm] = useState({
    shopId: "",
    productId: "",
    qty: "",
    cementBags: "", // Fully updated: added cement bags field
    selectedStaff: [] as string[]
  });

  // Mock Products
  const [products, setProducts] = useState<Product[]>([
    {
      id: "PROD-101",
      name: "Solid Bricks",
      qty: 45,
      image: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=150",
      description: "Standard construction bricks.",
      category: "Building Material",
      shopId: "shop1"
    },
    {
      id: "PROD-202",
      name: "Hollow Blocks",
      qty: 4,
      image: "https://images.unsplash.com/photo-1590069230005-db39bd7f744f?w=150",
      description: "6-inch concrete hollow blocks.",
      category: "Building Material",
      shopId: "shop2"
    },
    {
      id: "PROD-303",
      name: "Paving Stones",
      qty: 0,
      image: "https://images.unsplash.com/photo-1517646281044-8cc6379003cc?w=150",
      description: "Interlocking garden pavers.",
      category: "Landscaping",
      shopId: "shop1"
    },
  ]);

  const productionProducts = useMemo(() => {
    return products.filter(p => p.shopId === productionForm.shopId);
  }, [productionForm.shopId, products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.id.toLowerCase().includes(search.toLowerCase());
      const matchesShop = selectedShop === "all" || p.shopId === selectedShop;
      return matchesSearch && matchesShop;
    });
  }, [search, selectedShop, products]);

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !productionForm.selectedStaff.includes(val)) {
      setProductionForm({
        ...productionForm,
        selectedStaff: [...productionForm.selectedStaff, val]
      });
    }
  };

  const removeStaff = (name: string) => {
    setProductionForm({
      ...productionForm,
      selectedStaff: productionForm.selectedStaff.filter(s => s !== name)
    });
  };

  const handleProductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, qty } = productionForm;
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, qty: p.qty + Number(qty) } : p
    ));
    
    setProductionModal(false);
    setProductionForm({ shopId: "", productId: "", qty: "", cementBags: "", selectedStaff: [] });
    alert("Production record saved and inventory updated!");
  };

  const getStockStyle = (qty: number) => {
    if (qty === 0) return "bg-red-100 text-red-700 border-red-200";
    if (qty < 10) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
              <p className="text-slate-500 text-[10px] font-bold mb-8 uppercase tracking-widest">Daily Log for manufacturing units</p>

              <form onSubmit={handleProductionSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">1. Store</label>
                    <select 
                      required
                      value={productionForm.shopId}
                      onChange={(e) => setProductionForm({...productionForm, shopId: e.target.value, productId: ""})}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Shop</option>
                      <option value="shop1">Shop 1</option>
                      <option value="shop2">Shop 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">2. Units Produced</label>
                    <input 
                      required
                      type="number"
                      placeholder="00"
                      value={productionForm.qty}
                      onChange={(e) => setProductionForm({...productionForm, qty: e.target.value})}
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
                      onChange={(e) => setProductionForm({...productionForm, productId: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    >
                      <option value="">{productionForm.shopId ? "Choose Item" : "Select Store"}</option>
                      {productionProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">4. Cement Bags</label>
                    <div className="relative">
                      <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required
                        type="number"
                        placeholder="Qty Used"
                        value={productionForm.cementBags}
                        onChange={(e) => setProductionForm({...productionForm, cementBags: e.target.value})}
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* STAFF MULTI-SELECT */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">5. Assign Staff</label>
                  <div className="space-y-3">
                    <select 
                      onChange={handleStaffSelect}
                      className="w-full bg-gray-50 border-none rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="">Select Staff Members</option>
                      {STAFF_LIST.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      {productionForm.selectedStaff.length === 0 && (
                        <span className="text-[10px] text-slate-300 font-bold uppercase p-2">No staff selected</span>
                      )}
                      {productionForm.selectedStaff.map(name => (
                        <motion.span 
                          layout
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          key={name} 
                          className="flex items-center gap-1.5 bg-white border border-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-black shadow-sm"
                        >
                          <Users size={12} className="text-orange-500" />
                          {name}
                          <button type="button" onClick={() => removeStaff(name)} className="hover:text-red-500 ml-1">
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  <Save size={18} /> Save Daily Record
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
            onClick={() => setProductionModal(true)} 
            className="flex items-center justify-center gap-2 bg-white text-slate-800 border-2 border-slate-100 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-orange-500 transition-all active:scale-95 shadow-sm"
          >
            <CalendarDays size={16} className="text-orange-600" /> Today's Product
          </button>
          <button 
            onClick={() => navigate("/inventory/add")} 
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Units" value={filteredProducts.reduce((acc, p) => acc + p.qty, 0).toLocaleString()} icon={<Boxes className="text-blue-500" />} />
        <StatCard title="Low Stock" value={filteredProducts.filter(p => p.qty > 0 && p.qty < 10).length.toString()} icon={<TrendingDown className="text-amber-500" />} />
        <StatCard title="Out of Stock" value={filteredProducts.filter(p => p.qty === 0).length.toString()} icon={<Package className="text-red-500" />} />
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
          {['all', 'shop1', 'shop2'].map((shop) => (
            <button
              key={shop}
              onClick={() => setSelectedShop(shop)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedShop === shop ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {shop === 'all' ? 'All Stores' : `Shop ${shop.slice(-1)}`}
            </button>
          ))}
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by ID or Product Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6 text-left">Product Details</th>
                <th className="px-6 py-6 text-left">ID</th>
                <th className="px-6 py-6 text-left">Location</th>
                <th className="px-6 py-6 text-left">Status</th>
                <th className="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="group hover:bg-orange-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm uppercase">{product.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-slate-600 font-bold">{product.id}</span>
                  </td>
                  <td className="px-6 py-5 font-bold text-[11px] uppercase text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Store size={14} className="text-orange-500" />
                      {product.shopId === "shop1" ? "Shop 1" : "Shop 2"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStockStyle(product.qty)}`}>
                      {product.qty === 0 ? "Out of Stock" : `${product.qty} Units`}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-white rounded-xl transition-all shadow-sm"><Info size={18} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
      <div className="p-4 bg-gray-50 rounded-2xl shadow-inner">{icon}</div>
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
}