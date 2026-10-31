import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Building2,
  Trash2,
  Pencil,
  Calculator,
  FlaskConical,
  Package,
  History,
  RefreshCw,
  X,
  Save,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  getAllOffices,
  getAllProducts,
  getProductionRecipes,
  upsertProductionRecipe,
  deleteProductionRecipe,
  createProduct,
  getStock
} from "../../../api/inventory";

interface RecipeItem {
  id?: number;
  material_product_id: number | null;
  material_name: string;
  quantity: number;
  unit: string;
  is_cement: boolean;
  qty_per_brick?: number;
  qty_per_1000?: number;
  materialProduct?: {
    product_id: number;
    product_name: string;
    category: string;
    price_per_stock: string;
  };
}

interface MixRecipe {
  id: number;
  office_id: number;
  office_name: string;
  product_id: number;
  product_name: string;
  batch_bricks: number;
  description: string;
  is_active: boolean;
  created_at: string;
  items: RecipeItem[];
}

interface OfficeOption {
  office_id: number;
  office_name: string;
}

interface ProductOption {
  product_id: number;
  product_name: string;
  category: string;
  price_per_stock?: string;
}

interface ProductStockItem {
  stock_id: number;
  product_id: number;
  office_id: number;
  quantity: string;
  product?: {
    product_id: number;
    product_name: string;
    category: string;
    price_per_stock?: string;
  };
  office?: {
    office_id: number;
    office_name: string;
  };
}

interface FormItemState {
  material_product_id: number | null;
  material_name: string;
  quantity: string;
  unit: string;
  is_cement: boolean;
  is_custom?: boolean;
}

export default function ProductionMixRatioPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<MixRecipe[]>([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stocks, setStocks] = useState<ProductStockItem[]>([]);
  const [activeOfficeId, setActiveOfficeId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);

  // Quick New Material In DB Modal
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newMaterialCategory, setNewMaterialCategory] = useState("sand");
  const [newMaterialLoading, setNewMaterialLoading] = useState(false);

  // Form State
  const [formOfficeId, setFormOfficeId] = useState<number>(1);
  const [formProductId, setFormProductId] = useState<number>(1);
  const [formBatchBricks, setFormBatchBricks] = useState<number>(1000);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formItems, setFormItems] = useState<FormItemState[]>([
    { material_product_id: null, material_name: "OPC 53 Grade Cement", quantity: "12.5", unit: "Bags", is_cement: true },
    { material_product_id: null, material_name: "Stone Dust / M-Sand", quantity: "1.8", unit: "Units", is_cement: false },
    { material_product_id: null, material_name: "Class F Fly Ash", quantity: "0.8", unit: "Tonnes", is_cement: false },
    { material_product_id: null, material_name: "Chemical Admixture", quantity: "2.0", unit: "Litres", is_cement: false },
  ]);

  // Batch simulator per recipe
  const [simulatorBricks, setSimulatorBricks] = useState<Record<number, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [officesRes, productsRes, recipesRes, stocksRes] = await Promise.all([
        getAllOffices(),
        getAllProducts(),
        getProductionRecipes(),
        getStock()
      ]);

      const officeList: OfficeOption[] = Array.isArray(officesRes) ? officesRes : (officesRes.data || []);
      setOffices(officeList);

      const productList: ProductOption[] = Array.isArray(productsRes) ? productsRes : (productsRes.data || []);
      setProducts(productList);

      const stockList: ProductStockItem[] = Array.isArray(stocksRes) ? stocksRes : (stocksRes?.data || []);
      setStocks(stockList);

      if (recipesRes && recipesRes.success) {
        setRecipes(recipesRes.data || []);
      }

      if (officeList.length > 0 && !activeOfficeId) {
        setActiveOfficeId(officeList[0].office_id);
      }
    } catch (err) {
      console.error("Error loading mix ratio data:", err);
      toast.error("Failed to load production mix ratios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter recipes for currently active office tab
  const activeOfficeRecipes = useMemo(() => {
    if (!activeOfficeId) return recipes;
    return recipes.filter(r => r.office_id === activeOfficeId);
  }, [recipes, activeOfficeId]);

  // Helper to get finished brick products available in a specific branch alone
  const getBranchBrickProducts = (officeId: number) => {
    if (!officeId) return [];

    const branchStocks = stocks.filter(s => Number(s.office_id) === Number(officeId));
    const result: { product_id: number; product_name: string; quantity?: string }[] = [];
    const seenIds = new Set<number>();

    for (const s of branchStocks) {
      const prodMaster = products.find(p => p.product_id === s.product_id);
      const category = s.product?.category || prodMaster?.category;

      if (category === "bricks" && !seenIds.has(s.product_id)) {
        seenIds.add(s.product_id);
        result.push({
          product_id: s.product_id,
          product_name: s.product?.product_name || prodMaster?.product_name || `Brick Product #${s.product_id}`,
          quantity: s.quantity
        });
      }
    }

    // If editing a recipe for this office, ensure its brick product is included
    if (editingRecipeId) {
      const currentRecipe = recipes.find(r => r.id === editingRecipeId);
      if (currentRecipe && Number(currentRecipe.office_id) === Number(officeId) && !seenIds.has(currentRecipe.product_id)) {
        result.push({
          product_id: currentRecipe.product_id,
          product_name: currentRecipe.product_name || `Brick Product #${currentRecipe.product_id}`,
        });
      }
    }

    return result;
  };

  // Finished brick products ONLY for the selected Factory Office / Plant (formOfficeId)
  const branchFinishedBrickProducts = useMemo(() => {
    return getBranchBrickProducts(formOfficeId);
  }, [stocks, products, formOfficeId, editingRecipeId, recipes]);

  // Handle switching factory office/plant in the modal
  const handleOfficeChange = (newOfficeId: number) => {
    setFormOfficeId(newOfficeId);
    const available = getBranchBrickProducts(newOfficeId);
    const isStillValid = available.some(p => p.product_id === formProductId);
    if (isStillValid) {
      // Keep current selection
    } else if (available.length > 0) {
      setFormProductId(available[0].product_id);
    } else {
      setFormProductId(0);
    }
  };

  // Raw materials from backend (e.g. Chemical Admixture, OPC 53 Cement, Stone Dust, Fly Ash, etc.)
  const rawMaterialOptions = useMemo(() => {
    const list = products.filter(p => p.category !== "bricks");
    return list;
  }, [products]);

  // Simulator helper
  const getSimulatedCount = (recipeId: number) => {
    return simulatorBricks[recipeId] || 1000;
  };

  const handleSimulatorChange = (recipeId: number, val: number) => {
    setSimulatorBricks(prev => ({ ...prev, [recipeId]: val }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingRecipeId(null);
    const initialOfficeId = activeOfficeId || (offices[0]?.office_id || 1);
    setFormOfficeId(initialOfficeId);

    const availableBricks = getBranchBrickProducts(initialOfficeId);
    setFormProductId(availableBricks.length > 0 ? availableBricks[0].product_id : 0);
    setFormBatchBricks(1000);
    setFormDescription("");

    // Look for raw materials in backend product list
    const cementProd = rawMaterialOptions.find(p => p.product_name.toLowerCase().includes("cement"));
    const dustProd = rawMaterialOptions.find(p => p.product_name.toLowerCase().includes("dust") || p.product_name.toLowerCase().includes("sand"));
    const flyAshProd = rawMaterialOptions.find(p => p.product_name.toLowerCase().includes("fly"));
    const chemProd = rawMaterialOptions.find(p => p.product_name.toLowerCase().includes("chem") || p.product_name.toLowerCase().includes("admixture"));

    setFormItems([
      {
        material_product_id: cementProd ? cementProd.product_id : null,
        material_name: cementProd ? cementProd.product_name : "OPC 53 Grade Cement",
        quantity: "12.5",
        unit: "Bags",
        is_cement: true,
        is_custom: !cementProd
      },
      {
        material_product_id: dustProd ? dustProd.product_id : null,
        material_name: dustProd ? dustProd.product_name : "Stone Dust / M-Sand",
        quantity: "1.8",
        unit: "Units",
        is_cement: false,
        is_custom: !dustProd
      },
      {
        material_product_id: flyAshProd ? flyAshProd.product_id : null,
        material_name: flyAshProd ? flyAshProd.product_name : "Class F Fly Ash",
        quantity: "0.8",
        unit: "Tonnes",
        is_cement: false,
        is_custom: !flyAshProd
      },
      {
        material_product_id: chemProd ? chemProd.product_id : null,
        material_name: chemProd ? chemProd.product_name : "Chemical Admixture",
        quantity: "2.0",
        unit: "Litres",
        is_cement: false,
        is_custom: !chemProd
      }
    ]);

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (recipe: MixRecipe) => {
    setEditingRecipeId(recipe.id);
    setFormOfficeId(recipe.office_id);
    setFormProductId(recipe.product_id);
    setFormBatchBricks(recipe.batch_bricks);
    setFormDescription(recipe.description || "");

    setFormItems(
      recipe.items.map(item => {
        const matchingBackendProd = rawMaterialOptions.find(
          p => p.product_id === item.material_product_id || p.product_name.toLowerCase() === item.material_name.toLowerCase()
        );

        return {
          material_product_id: matchingBackendProd ? matchingBackendProd.product_id : item.material_product_id,
          material_name: matchingBackendProd ? matchingBackendProd.product_name : item.material_name,
          quantity: String(item.quantity),
          unit: item.unit,
          is_cement: item.is_cement,
          is_custom: !matchingBackendProd && !item.material_product_id
        };
      })
    );

    setIsModalOpen(true);
  };

  // Handle selecting raw material from dropdown
  const handleMaterialDropdownChange = (index: number, val: string) => {
    setFormItems(prev => {
      const copy = [...prev];
      if (val === "custom") {
        copy[index] = {
          ...copy[index],
          material_product_id: null,
          material_name: "",
          is_custom: true
        };
        return copy;
      }

      const prodId = Number(val);
      const prod = rawMaterialOptions.find(p => p.product_id === prodId);
      if (prod) {
        let unit = copy[index].unit || "Units";
        let isCement = false;
        const lower = prod.product_name.toLowerCase();

        if (lower.includes("cement") || prod.category === "cement") {
          unit = "Bags";
          isCement = true;
        } else if (lower.includes("chem") || lower.includes("admixture") || lower.includes("water") || lower.includes("liquid")) {
          unit = "Litres";
        } else if (lower.includes("fly") || lower.includes("ash")) {
          unit = "Tonnes";
        } else if (lower.includes("dust") || lower.includes("sand") || lower.includes("chip")) {
          unit = "Units";
        }

        copy[index] = {
          ...copy[index],
          material_product_id: prodId,
          material_name: prod.product_name,
          unit,
          is_cement: isCement,
          is_custom: false
        };
      }
      return copy;
    });
  };

  // Add Item to Form
  const addFormItem = () => {
    const defaultRaw = rawMaterialOptions[0];
    setFormItems(prev => [
      ...prev,
      {
        material_product_id: defaultRaw ? defaultRaw.product_id : null,
        material_name: defaultRaw ? defaultRaw.product_name : "",
        quantity: "1.0",
        unit: defaultRaw && defaultRaw.product_name.toLowerCase().includes("chem") ? "Litres" : "Units",
        is_cement: Boolean(defaultRaw && defaultRaw.category === "cement"),
        is_custom: !defaultRaw
      }
    ]);
  };

  // Remove Item from Form
  const removeFormItem = (index: number) => {
    if (formItems.length <= 1) {
      toast.error("At least one raw material is required.");
      return;
    }
    setFormItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const updateFormItemField = (index: number, field: keyof FormItemState, value: any) => {
    setFormItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Quick Create New Raw Material in Backend DB
  const handleCreateNewMaterialInDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) {
      toast.error("Please enter a raw material name.");
      return;
    }

    setNewMaterialLoading(true);
    try {
      const formData = new FormData();
      formData.append("product_name", newMaterialName.trim());
      formData.append("category", newMaterialCategory);
      formData.append("description", `Raw Material for Brick Production Mix Ratios`);

      const res = await createProduct(formData);
      if (res && res.success) {
        toast.success(`Raw material "${newMaterialName.trim()}" added to database!`);
        setIsNewMaterialModalOpen(false);
        setNewMaterialName("");
        // Reload products & stocks
        const [updated, updatedStocks] = await Promise.all([
          getAllProducts(),
          getStock()
        ]);
        const productList: ProductOption[] = Array.isArray(updated) ? updated : (updated.data || []);
        setProducts(productList);
        const stockList: ProductStockItem[] = Array.isArray(updatedStocks) ? updatedStocks : (updatedStocks?.data || []);
        setStocks(stockList);

        // Auto select the new material for the first custom row or add a new row with it
        const newProd = productList.find(p => p.product_name.toLowerCase() === newMaterialName.trim().toLowerCase());
        if (newProd) {
          setFormItems(prev => [
            ...prev,
            {
              material_product_id: newProd.product_id,
              material_name: newProd.product_name,
              quantity: "1.0",
              unit: newMaterialCategory === "cement" ? "Bags" : newMaterialName.toLowerCase().includes("chem") ? "Litres" : "Units",
              is_cement: newMaterialCategory === "cement",
              is_custom: false
            }
          ]);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create raw material in database");
    } finally {
      setNewMaterialLoading(false);
    }
  };

  // Save Recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formOfficeId || !formProductId || formProductId === 0) {
      toast.error("Please select a factory office and a finished brick product available in that branch.");
      return;
    }

    if (formItems.some(i => !i.material_name || parseFloat(i.quantity) <= 0)) {
      toast.error("Please enter valid names and quantities for all raw materials.");
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        office_id: Number(formOfficeId),
        product_id: Number(formProductId),
        batch_bricks: Number(formBatchBricks) || 1000,
        description: formDescription,
        items: formItems.map(i => ({
          material_product_id: i.material_product_id ? Number(i.material_product_id) : null,
          material_name: i.material_name,
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit || "Units",
          is_cement: Boolean(i.is_cement)
        }))
      };

      await upsertProductionRecipe(payload);
      toast.success("Mix ratio saved successfully!");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save recipe");
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this plant mix ratio?")) return;
    try {
      await deleteProductionRecipe(id);
      toast.success("Recipe removed");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete recipe");
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in font-sans text-slate-800">
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full font-bold text-[10px] uppercase tracking-wider">
              <FlaskConical size={11} /> Bill of Materials (BOM) & Recipe Engine
            </span>
            <span className="text-xs font-bold text-slate-400">
              • Plant-Specific Mix Ratios
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            Plant Production <span className="text-indigo-600">Mix Ratios</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Configure raw material mix ratios (cement, stone dust, fly ash, chemical admixture) per plant to calculate exact material usage for 1 brick.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => navigate("/inventory/history")}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <History size={14} className="text-slate-500" />
            <span>Production Logs</span>
          </button>
          <button
            onClick={() => navigate("/inventory/bom")}
            className="h-10 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Layers size={14} />
            <span>Stock Depletion</span>
          </button>
          <button
            onClick={openCreateModal}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/25 cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>New Plant Mix Ratio</span>
          </button>
        </div>
      </div>

      {/* ── HOW MATERIAL IS CALCULATED FOR ONE BRICK (EXPLANATION CALLOUT) ── */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                <Calculator size={11} /> Formula Architecture
              </span>
              <span className="text-xs text-white/50">Mathematical Standard</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              How Material Used for 1 Brick is Calculated
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Each factory office specifies a recipe for a standard batch (e.g. <span className="text-white font-bold">1,000 bricks</span>).
              The system calculates the single-unit consumption ratio:
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-indigo-200">
              <span>Qty for 1 Brick</span>
              <span>=</span>
              <span className="text-white">Batch Raw Material Quantity</span>
              <span>÷</span>
              <span className="text-amber-300">Number of Bricks in Batch</span>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/15 text-xs space-y-2 shrink-0 md:min-w-[280px]">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Backend Raw Material Drops:</p>
            <div className="space-y-1 text-[11px] text-slate-200 font-medium">
              <p>• <span className="text-white font-bold">Chemical Admixture:</span> 2.0 L ÷ 1,000 = <span className="text-cyan-300 font-bold">0.0020 L / Brick</span></p>
              <p>• <span className="text-white font-bold">OPC 53 Cement:</span> 12.5 Bags ÷ 1,000 = <span className="text-amber-300 font-bold">0.0125 Bags / Brick</span></p>
              <p>• <span className="text-white font-bold">Stone Dust:</span> 1.8 Units ÷ 1,000 = <span className="text-emerald-300 font-bold">0.0018 Units / Brick</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* ── OFFICE PLANT SELECTION TABS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
            <Building2 size={14} /> Select Plant / Office:
          </span>
          {offices.map(off => {
            const isSelected = activeOfficeId === off.office_id;
            const count = recipes.filter(r => r.office_id === off.office_id).length;
            return (
              <button
                key={off.office_id}
                onClick={() => setActiveOfficeId(off.office_id)}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                <span>{off.office_name}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {count} Mixes
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchData}
          className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200/80 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Refresh Data"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── RECIPE CARDS GRID ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">
            Loading Plant Mix Ratios...
          </p>
        </div>
      ) : activeOfficeRecipes.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
            <FlaskConical size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Mix Ratios Configured for this Plant</h3>
          <p className="text-slate-400 font-medium text-xs max-w-sm mt-1">
            Configure a recipe for 6" Mold, 6" Hollow, or other brick types to enable automatic raw material deduction and 1-brick calculations.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
          >
            Create Mix Ratio for this Office
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {activeOfficeRecipes.map(recipe => {
            const currentSim = getSimulatedCount(recipe.id);
            const simMultiplier = currentSim / recipe.batch_bricks;

            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Package size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                            {recipe.product_name}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            • {recipe.office_name}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                          {recipe.description || `${recipe.product_name} Production Formula`}
                        </h3>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(recipe)}
                        className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Mix Ratio"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="w-8 h-8 rounded-xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete Mix Ratio"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Standard Batch Ratio Strip */}
                  <div className="mt-3.5 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">
                      Base Standard Batch:
                    </span>
                    <span className="text-slate-900 font-bold font-mono">
                      {recipe.batch_bricks.toLocaleString()} Bricks Output
                    </span>
                  </div>

                  {/* Raw Materials Table Breakdown */}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="py-2 px-2">Raw Material</th>
                          <th className="py-2 px-2 text-right">Batch Qty</th>
                          <th className="py-2 px-2 text-right text-indigo-600 font-black">Per 1 Brick</th>
                          <th className="py-2 px-2 text-right">Per 1,000 Bricks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/70 font-medium">
                        {recipe.items.map((item, idx) => {
                          const perBrick = item.qty_per_brick || (item.quantity / recipe.batch_bricks);
                          const per1000 = perBrick * 1000;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-1.5">
                                  {item.is_cement ? (
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Primary Cement Component" />
                                  ) : (
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                                  )}
                                  <span className="font-bold text-slate-800">
                                    {item.material_name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2.5 px-2 text-right tabular-nums font-black text-indigo-700 bg-indigo-50/40 rounded-lg">
                                {perBrick.toFixed(4)} <span className="text-[10px] text-indigo-500 font-normal">{item.unit}</span>
                              </td>
                              <td className="py-2.5 px-2 text-right tabular-nums text-slate-600">
                                {per1000.toFixed(2)} {item.unit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Interactive Batch Simulator on the Card */}
                <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Calculator size={14} className="text-indigo-600" />
                      <span>Live Batch Consumption Calculator:</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">Produce:</span>
                      <div className="flex items-center gap-1">
                        {[500, 1000, 2000, 5000].map(cnt => (
                          <button
                            key={cnt}
                            onClick={() => handleSimulatorChange(recipe.id, cnt)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              currentSim === cnt
                                ? "bg-slate-900 text-white shadow-2xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={currentSim}
                        onChange={e => handleSimulatorChange(recipe.id, Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-20 h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold text-right tabular-nums outline-none focus:border-indigo-600 bg-white"
                      />
                      <span className="text-[11px] font-bold text-slate-500">pcs</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {recipe.items.map((item, i) => {
                      const needed = (item.quantity * simMultiplier).toFixed(2);
                      return (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate">
                            {item.material_name}
                          </p>
                          <p className="text-xs sm:text-sm font-black text-slate-900 tabular-nums mt-0.5">
                            {needed} <span className="text-[10px] font-bold text-slate-500">{item.unit}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CREATE OR EDIT PRODUCTION MIX RATIO ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {editingRecipeId ? "Edit Plant Mix Ratio" : "Create New Plant Mix Ratio"}
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      Define raw material breakdown for finished brick production
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveRecipe} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Select Office */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Factory Office / Plant
                    </label>
                    <select
                      value={formOfficeId}
                      onChange={e => handleOfficeChange(Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {offices.map(o => (
                        <option key={o.office_id} value={o.office_id}>
                          {o.office_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Finished Brick Product (BRICKS ONLY IN THIS BRANCH!) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-500 block">
                        Finished Brick Product
                      </label>
                      {branchFinishedBrickProducts.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600">
                          {branchFinishedBrickProducts.length} in branch
                        </span>
                      )}
                    </div>
                    <select
                      value={formProductId || ""}
                      onChange={e => setFormProductId(Number(e.target.value))}
                      disabled={branchFinishedBrickProducts.length === 0}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer"
                    >
                      {branchFinishedBrickProducts.length === 0 ? (
                        <option value="" disabled>
                          No brick products in this branch
                        </option>
                      ) : (
                        branchFinishedBrickProducts.map(p => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name}
                          </option>
                        ))
                      )}
                    </select>
                    {branchFinishedBrickProducts.length === 0 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        ⚠️ No brick products available in this branch alone.
                      </p>
                    )}
                  </div>

                  {/* Batch Bricks Output */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Batch Output (Bricks)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formBatchBricks}
                      onChange={e => setFormBatchBricks(Math.max(1, parseInt(e.target.value) || 1000))}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 tabular-nums"
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Mix Description / Formula Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="e.g. Office 1 High-Strength 6-Inch Mold Mix"
                    className="w-full h-10 px-3.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Raw Material Rows */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                        Raw Material Breakdown (Batch of {formBatchBricks.toLocaleString()} Bricks)
                      </label>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Select raw materials from the backend database dropdown:
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNewMaterialModalOpen(true)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Add new raw material item to database"
                      >
                        <Plus size={12} /> New Material in DB
                      </button>
                      <button
                        type="button"
                        onClick={addFormItem}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} /> Add Row
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, idx) => {
                      const qtyNum = parseFloat(item.quantity) || 0;
                      const perBrick = formBatchBricks > 0 ? (qtyNum / formBatchBricks) : 0;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                        >
                          {/* 1. BACKEND RAW MATERIAL DROPDOWN */}
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block sm:hidden">
                              Raw Material
                            </label>
                            <select
                              value={item.is_custom ? "custom" : (item.material_product_id || "")}
                              onChange={e => handleMaterialDropdownChange(idx, e.target.value)}
                              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                            >
                              <option value="" disabled>-- Select Material from Backend --</option>
                              {rawMaterialOptions.map(m => (
                                <option key={m.product_id} value={m.product_id}>
                                  {m.product_name}
                                </option>
                              ))}
                              <option value="custom">✏️ + Custom Material Name...</option>
                            </select>

                            {/* If custom is selected, allow typing custom name */}
                            {item.is_custom && (
                              <input
                                type="text"
                                value={item.material_name}
                                onChange={e => updateFormItemField(idx, "material_name", e.target.value)}
                                placeholder="Enter custom raw material name..."
                                className="w-full h-8 px-2.5 bg-white border border-indigo-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 mt-1"
                              />
                            )}
                          </div>

                          {/* 2. BATCH QTY */}
                          <div className="w-24 shrink-0 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block sm:hidden">
                              Batch Qty
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={item.quantity}
                              onChange={e => updateFormItemField(idx, "quantity", e.target.value)}
                              placeholder="Qty"
                              className="w-full h-10 px-2.5 text-right bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 tabular-nums"
                            />
                          </div>

                          {/* 3. UNIT */}
                          <div className="w-24 shrink-0 space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block sm:hidden">
                              Unit
                            </label>
                            <select
                              value={item.unit}
                              onChange={e => updateFormItemField(idx, "unit", e.target.value)}
                              className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                            >
                              <option value="Litres">Litres</option>
                              <option value="Bags">Bags</option>
                              <option value="Units">Units</option>
                              <option value="Tonnes">Tonnes</option>
                              <option value="Kg">Kg</option>
                            </select>
                          </div>

                          {/* 4. LIVE 1-BRICK METRIC */}
                          <div className="bg-indigo-50/70 border border-indigo-100 px-3 py-1.5 rounded-xl text-center shrink-0 min-w-[95px] flex flex-col justify-center">
                            <p className="text-[8px] font-black uppercase tracking-wider text-indigo-500">Per 1 Brick</p>
                            <p className="text-[11px] font-black text-indigo-900 tabular-nums">
                              {perBrick.toFixed(4)} <span className="text-[9px] font-normal text-indigo-500">{item.unit}</span>
                            </p>
                          </div>

                          {/* 5. REMOVE */}
                          <button
                            type="button"
                            onClick={() => removeFormItem(idx)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-colors cursor-pointer shrink-0 self-center"
                            title="Remove Material Row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-10 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading || branchFinishedBrickProducts.length === 0}
                    className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {modalLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Save Plant Mix Ratio</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: QUICK ADD NEW RAW MATERIAL IN DATABASE ── */}
      <AnimatePresence>
        {isNewMaterialModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewMaterialModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Add Raw Material to Database
                  </h3>
                </div>
                <button
                  onClick={() => setIsNewMaterialModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateNewMaterialInDB} className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Raw Material Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newMaterialName}
                    onChange={e => setNewMaterialName(e.target.value)}
                    placeholder="e.g. Chemical Accelerator, Fly Ash Special..."
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Category
                  </label>
                  <select
                    value={newMaterialCategory}
                    onChange={e => setNewMaterialCategory(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="sand">Aggregates / Sand / Chemicals</option>
                    <option value="cement">Cement Product</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewMaterialModalOpen(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={newMaterialLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {newMaterialLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    <span>Save to Backend</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
