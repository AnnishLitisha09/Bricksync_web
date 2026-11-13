import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Users, X, ChevronDown, Check, Phone, ArrowRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CustomerOption {
  id: number | string;
  name: string;
  phone_no?: string;
  balance?: number | string;
  category?: string;
}

interface SearchableCustomerSelectProps {
  customers: CustomerOption[];
  value: string | number;
  onChange: (customerId: string, customer?: CustomerOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  onSelectNext?: () => void;
  inputRef?: React.Ref<any>;
}

const RECENT_KEY = "bricksync_recent_customers";

function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentId(id: string) {
  try {
    const list = getRecentIds().filter((i) => i !== id);
    list.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    // ignore
  }
}

const SearchableCustomerSelect: React.FC<SearchableCustomerSelectProps> = ({
  customers,
  value,
  onChange,
  placeholder = "Search client by name or phone...",
  disabled = false,
  className = "",
  onSelectNext,
  inputRef: externalInputRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isEnter = (e: React.KeyboardEvent | KeyboardEvent) =>
    e.key === "Enter" || e.key === "Return" || e.keyCode === 13 || e.which === 13 || e.code === "Enter" || e.code === "NumpadEnter";

  // Selected customer object
  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(value)),
    [customers, value]
  );

  useEffect(() => {
    if (!externalInputRef) return;
    const refObj = {
      focus: () => {
        if (!selectedCustomer) {
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 40);
        } else {
          triggerRef.current?.focus();
        }
      },
      click: () => {
        handleOpen();
      },
      scrollIntoView: (options?: any) => {
        containerRef.current?.scrollIntoView(options);
      }
    };

    if (typeof externalInputRef === "function") {
      externalInputRef(refObj);
    } else {
      (externalInputRef as React.MutableRefObject<any>).current = refObj;
    }
  }, [externalInputRef, selectedCustomer]);

  // Recent customers list (for 1-click frequent customer selection)
  const recentCustomers = useMemo(() => {
    const ids = getRecentIds();
    return ids
      .map((id) => customers.find((c) => String(c.id) === id))
      .filter(Boolean) as CustomerOption[];
  }, [customers, isOpen]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone_no && c.phone_no.toLowerCase().includes(term)) ||
        String(c.id).includes(term)
    );
  }, [customers, search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearch("");
  };

  const handleSelect = (customer: CustomerOption) => {
    const idStr = String(customer.id);
    saveRecentId(idStr);
    onChange(idStr, customer);
    setIsOpen(false);
    setSearch("");
    if (onSelectNext) {
      setTimeout(onSelectNext, 40);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearch("");
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (isEnter(e)) {
        e.preventDefault();
        if (selectedCustomer && onSelectNext) {
          onSelectNext();
          return;
        }
        setIsOpen(true);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
        setSearch(e.key);
        return;
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(filteredCustomers.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (isEnter(e)) {
      e.preventDefault();
      const target = filteredCustomers[selectedIndex] || filteredCustomers[0];
      if (target) {
        handleSelect(target);
      } else if (selectedCustomer && onSelectNext) {
        setIsOpen(false);
        onSelectNext();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button / Display */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        tabIndex={disabled ? -1 : 0}
        className={`w-full h-10 px-3 rounded-xl border bg-white flex items-center justify-between gap-2 cursor-pointer transition-all shadow-2xs select-none ${
          isOpen
            ? "border-indigo-600 ring-2 ring-indigo-500/20"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              selectedCustomer ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Users size={14} />
          </div>

          {selectedCustomer ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold text-slate-900 truncate">
                {selectedCustomer.name}
              </span>
              {selectedCustomer.phone_no && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  • {selectedCustomer.phone_no}
                </span>
              )}
              {Number(selectedCustomer.balance) > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                  Due ₹{Number(selectedCustomer.balance).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedCustomer && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden max-h-[380px] flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
              <Search size={14} className="text-slate-400 shrink-0 ml-1" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type name or phone number..."
                className="w-full bg-transparent outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Recent Clients (Shown when search is empty) */}
            {!search && recentCustomers.length > 0 && (
              <div className="p-2 border-b border-slate-100 bg-indigo-50/20">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  <Clock size={11} />
                  <span>Recent Clients</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {recentCustomers.map((rc) => (
                    <button
                      key={rc.id}
                      type="button"
                      onClick={() => handleSelect(rc)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        String(rc.id) === String(value)
                          ? "bg-indigo-600 text-white shadow-2xs font-bold"
                          : "bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200"
                      }`}
                    >
                      <span className="truncate max-w-[120px]">{rc.name}</span>
                      <ArrowRight size={10} className="opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, index) => {
                  const isSelected = String(c.id) === String(value);
                  const isHighlighted = index === selectedIndex;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50/90 text-indigo-900 border border-indigo-100"
                          : isHighlighted
                          ? "bg-slate-100/80 text-slate-900"
                          : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-white"
                          }`}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {c.phone_no ? (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone size={9} />
                                {c.phone_no}
                              </span>
                            ) : (
                              <span>No phone</span>
                            )}
                            <span>• #{c.id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {Number(c.balance) > 0 ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
                            Due ₹{Number(c.balance).toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Clear</span>
                        )}
                        {isSelected && <Check size={14} className="text-indigo-600 ml-1" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Users size={22} className="mx-auto mb-1.5 text-slate-300" />
                  <p className="text-xs font-semibold">No clients match "{search}"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try searching with phone number</p>
                </div>
              )}
            </div>

            {/* Footer with Customer Count */}
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 flex items-center justify-between">
              <span>{filteredCustomers.length} clients available</span>
              <span className="text-slate-400 font-normal">Click client to select</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableCustomerSelect;
