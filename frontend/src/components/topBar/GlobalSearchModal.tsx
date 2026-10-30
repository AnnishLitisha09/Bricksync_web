import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Users,
  Truck,
  UserCheck,
  Building2,
  FileText,
  Plus,
  ExternalLink,
  CreditCard,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Layers,
  Tv,
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchCustomers } from "../../api/customer";
import { fetchVehicles } from "../../api/vehicle";
import { getEmployees } from "../../api/inventory";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_MODULES = [
  { name: "Executive BI & P&L", path: "/bi-analytics", icon: TrendingUp, category: "Analytics" },
  { name: "BOM & Stock Depletion", path: "/inventory/bom", icon: Layers, category: "Inventory" },
  { name: "Factory TV Kiosk Mode", path: "/kiosk", icon: Tv, category: "Operations" },
  { name: "Customer Directory", path: "/customers", icon: Users, category: "Navigation" },
  { name: "Material Entry (New Dispatch)", path: "/customer/add-material/new", icon: Plus, category: "Action" },
  { name: "Today's Delivery Entry", path: "/customer/entry", icon: FileText, category: "Action" },
  { name: "Staff Salaries & Payroll", path: "/salary", icon: UserCheck, category: "Finance" },
  { name: "Bank Treasury", path: "/banks", icon: CreditCard, category: "Finance" },
  { name: "Stock & Production", path: "/stock", icon: Building2, category: "Inventory" },
  { name: "Fleet Vehicles", path: "/vehicles", icon: Truck, category: "Fleet" },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch reference data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setQuery("");
      setSelectedIndex(0);

      Promise.all([
        fetchCustomers("", 1, 1000).catch(() => ({ data: [] })),
        fetchVehicles().catch(() => []),
        getEmployees().catch(() => ({ data: [] })),
      ]).then(([cRes, vRes, sRes]) => {
        setCustomers(cRes.data || []);
        setVehicles(vRes || []);
        setStaff(sRes.data || []);
        setLoading(false);
      });

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtered results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();

    // Matching modules
    const matchedModules = QUICK_MODULES.filter((m) =>
      !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );

    // Matching customers
    const matchedCustomers = !q
      ? customers.slice(0, 5) // Show top 5 recent/frequent when empty
      : customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone_no && c.phone_no.toLowerCase().includes(q)) ||
            String(c.id).includes(q)
        ).slice(0, 8);

    // Matching vehicles
    const matchedVehicles = !q
      ? []
      : vehicles.filter(
          (v) =>
            v.vehicleNumber?.toLowerCase().includes(q) ||
            v.vehicleName?.toLowerCase().includes(q)
        ).slice(0, 4);

    // Matching staff
    const matchedStaff = !q
      ? []
      : staff.filter(
          (s) =>
            s.employee_name?.toLowerCase().includes(q) ||
            s.designation?.toLowerCase().includes(q) ||
            (s.phone_number && s.phone_number.includes(q))
        ).slice(0, 4);

    return {
      modules: matchedModules,
      customers: matchedCustomers,
      vehicles: matchedVehicles,
      staff: matchedStaff,
    };
  }, [query, customers, vehicles, staff]);

  // Flattened items for keyboard arrow navigation
  const flatItems = useMemo(() => {
    const list: { type: string; item: any; action: () => void }[] = [];
    results.customers.forEach((c) => {
      list.push({
        type: "customer",
        item: c,
        action: () => {
          navigate(`/customer/details/${c.id}`);
          onClose();
        },
      });
    });
    results.modules.forEach((m) => {
      list.push({
        type: "module",
        item: m,
        action: () => {
          navigate(m.path);
          onClose();
        },
      });
    });
    results.vehicles.forEach((v) => {
      list.push({
        type: "vehicle",
        item: v,
        action: () => {
          navigate(`/vehicles/view/${v.id}`);
          onClose();
        },
      });
    });
    results.staff.forEach((s) => {
      list.push({
        type: "staff",
        item: s,
        action: () => {
          navigate(`/staff/view/${s.employee_id}`);
          onClose();
        },
      });
    });
    return list;
  }, [results, navigate, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Search Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        onKeyDown={handleKeyDown}
        className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] z-10"
      >
        {/* Top Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Search size={16} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type customer name, phone, vehicle or navigation..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {/* Customers Section */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users size={12} className="text-indigo-600" />
                  <span>{query ? "Matching Clients" : "Frequent Clients"}</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {results.customers.length} clients
                </span>
              </div>

              <div className="space-y-1">
                {results.customers.map((c) => {
                  const globalIdx = flatItems.findIndex(
                    (fi) => fi.type === "customer" && fi.item.id === c.id
                  );
                  const isHighlighted = globalIdx === selectedIndex;

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate(`/customer/details/${c.id}`);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors group ${
                        isHighlighted
                          ? "bg-indigo-50/90 border border-indigo-100"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {c.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            {c.phone_no ? <span>{c.phone_no}</span> : <span>No phone</span>}
                            <span>• #{c.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {Number(c.balance) > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                            Due ₹{Number(c.balance).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Settled</span>
                        )}

                        {/* Quick 1-Click Action Buttons */}
                        <div
                          className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/customer/add-material/${c.id}`);
                              onClose();
                            }}
                            className="h-7 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            title="Create Dispatch for this Client"
                          >
                            <Plus size={12} />
                            <span>Dispatch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/customer/details/${c.id}`);
                              onClose();
                            }}
                            className="h-7 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Open Full Ledger"
                          >
                            <span>Ledger</span>
                            <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Vehicles Section */}
          {results.vehicles.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Truck size={12} className="text-indigo-600" />
                <span>Matching Fleet Vehicles</span>
              </div>
              <div className="space-y-1">
                {results.vehicles.map((v) => {
                  const globalIdx = flatItems.findIndex(
                    (fi) => fi.type === "vehicle" && fi.item.id === v.id
                  );
                  const isHighlighted = globalIdx === selectedIndex;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        navigate(`/vehicles/view/${v.id}`);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-indigo-50/90 border border-indigo-100"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Truck size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase">
                            {v.vehicleNumber}
                          </p>
                          <p className="text-[10px] text-slate-400">{v.vehicleName}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {v.kilometer?.toLocaleString()} KM
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Pages Navigation */}
          {results.modules.length > 0 && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles size={12} className="text-indigo-600" />
                <span>Quick Modules & Shortcuts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {results.modules.map((m) => {
                  const Icon = m.icon;
                  const globalIdx = flatItems.findIndex(
                    (fi) => fi.type === "module" && fi.item.path === m.path
                  );
                  const isHighlighted = globalIdx === selectedIndex;

                  return (
                    <div
                      key={m.path}
                      onClick={() => {
                        navigate(m.path);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-indigo-50/90 border border-indigo-100"
                          : "bg-slate-50/60 hover:bg-slate-100/80 border border-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-200/60 flex items-center justify-center text-indigo-600 shrink-0">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {m.name}
                        </span>
                      </div>
                      <ArrowRight size={12} className="text-slate-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {flatItems.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <Search size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching client name, phone number, or vehicle number
              </p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-2.5 px-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold">
                ENTER
              </kbd>{" "}
              Select
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 1-Click Mouse Select
            </span>
          </div>
          <span className="text-indigo-600 font-bold">BrickSync Spotlight</span>
        </div>
      </motion.div>
    </div>
  );
}
