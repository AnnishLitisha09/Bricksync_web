import React, { useState, useRef, useEffect, useMemo } from "react";
import { Package, ChevronDown, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface MaterialOption {
  product_id: number;
  product_name: string;
  category?: string;
  price_per_stock?: number | string;
}

export interface StockOption {
  product_id: number;
  office_id: number;
  quantity: number;
}

interface SearchableMaterialSelectProps {
  products: MaterialOption[];
  stocks?: StockOption[];
  officeId?: string | number;
  value: string | number;
  onChange: (productId: string, productName: string, defaultPrice?: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelectNext?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const SearchableMaterialSelect: React.FC<SearchableMaterialSelectProps> = ({
  products,
  stocks = [],
  officeId,
  value,
  onChange,
  placeholder = "Select Material (type 'xl', name)...",
  disabled = false,
  className = "",
  onSelectNext,
  inputRef: externalInputRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync ref with external ref so focus() from outside works reliably
  useEffect(() => {
    if (!externalInputRef) return;
    if (typeof externalInputRef === "function") {
      externalInputRef(inputRef.current);
    } else {
      (externalInputRef as React.MutableRefObject<HTMLInputElement | null>).current =
        inputRef.current;
    }
  }, [externalInputRef]);

  // Selected product object
  const selectedProduct = useMemo(
    () => products.find((p) => String(p.product_id) === String(value)),
    [products, value]
  );

  // Selected product stock in current office
  const selectedStock = useMemo(() => {
    if (!selectedProduct || !officeId) return null;
    return stocks.find(
      (s) =>
        s.product_id === selectedProduct.product_id &&
        String(s.office_id) === String(officeId)
    );
  }, [selectedProduct, officeId, stocks]);

  // Filtered products based on query (case-insensitive substring match)
  const filteredProducts = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return products;

    const terms = term.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const name = p.product_name.toLowerCase();
      const cat = (p.category || "").toLowerCase();
      return terms.every((t) => name.includes(t) || cat.includes(t));
    });
  }, [products, query]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProducts.length, query]);

  // Auto-scroll to selected index in dropdown
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLDivElement>("[data-material-item]");
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isEnter = (e: React.KeyboardEvent | KeyboardEvent) =>
    e.key === "Enter" || e.key === "Return" || e.keyCode === 13 || e.which === 13 || e.code === "Enter" || e.code === "NumpadEnter";

  const handleSelect = (product: MaterialOption) => {
    const pId = String(product.product_id);
    const price = product.price_per_stock ? Number(product.price_per_stock) : undefined;
    onChange(pId, product.product_name, price);
    setIsOpen(false);
    setQuery("");
    if (onSelectNext) {
      setTimeout(onSelectNext, 40);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", "");
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
    // Select all existing text so immediate typing replaces it
    try {
      e.target.select();
    } catch (_) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(filteredProducts.length - 1, 0)));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
      return;
    }

    if (isEnter(e)) {
      e.preventDefault();
      if (isOpen && filteredProducts.length > 0) {
        const target = filteredProducts[selectedIndex] || filteredProducts[0];
        if (target) {
          handleSelect(target);
          return;
        }
      }

      // If dropdown is closed but an item is already selected, advance to next field
      if (selectedProduct) {
        setIsOpen(false);
        setQuery("");
        if (onSelectNext) {
          onSelectNext();
        }
        return;
      }

      // If closed and empty, open dropdown
      if (!isOpen) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setQuery("");
      return;
    }

    if (e.key === "Tab") {
      if (isOpen && filteredProducts.length > 0 && query.trim()) {
        const target = filteredProducts[selectedIndex] || filteredProducts[0];
        if (target) {
          handleSelect(target);
        }
      }
      setIsOpen(false);
      setQuery("");
    }
  };

  // Determine displayed input value
  const displayValue = isOpen ? query : (selectedProduct ? selectedProduct.product_name : "");

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Combobox Trigger Box with Single Persistent Input */}
      <div
        className={`w-full h-10 px-3 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all shadow-2xs ${
          isOpen
            ? "border-indigo-600 ring-2 ring-indigo-500/20"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 overflow-hidden">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              selectedProduct ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Package size={14} />
          </div>

          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              value={displayValue}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={selectedProduct ? selectedProduct.product_name : placeholder}
              className={`w-full bg-transparent outline-none text-xs ${
                selectedProduct && !isOpen ? "font-bold text-slate-800" : "font-semibold text-slate-800"
              } placeholder:text-slate-400`}
            />
          </div>

          {selectedStock !== null && selectedStock !== undefined && !isOpen && (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
              {selectedStock.quantity || 0} left
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedProduct && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden max-h-[300px] flex flex-col"
          >
            {/* Header info */}
            <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{query ? `Filtering for "${query}"` : "Type 'xl' or name to filter"}</span>
              <span>{filteredProducts.length} materials</span>
            </div>

            {/* Material List */}
            <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  const isCurrent = String(p.product_id) === String(value);

                  const stockItem = officeId
                    ? stocks.find(
                        (s) =>
                          s.product_id === p.product_id &&
                          String(s.office_id) === String(officeId)
                      )
                    : null;
                  const qtyLeft = stockItem?.quantity ?? 0;

                  return (
                    <div
                      key={p.product_id}
                      data-material-item
                      onClick={() => handleSelect(p)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isHighlighted
                          ? "bg-indigo-50 text-indigo-900 border border-indigo-100/80 shadow-2xs"
                          : isCurrent
                          ? "bg-slate-50 text-slate-900 font-bold"
                          : "hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isHighlighted
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Package size={14} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate leading-tight">
                            {p.product_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.category && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                {p.category}
                              </span>
                            )}
                            {p.price_per_stock ? (
                              <span className="text-[10px] text-slate-500 font-semibold">
                                • ₹{Number(p.price_per_stock).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            qtyLeft > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {qtyLeft.toLocaleString()} left
                        </span>
                        {isCurrent && <Check size={14} className="text-indigo-600 ml-1" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-400">
                  <AlertCircle size={20} className="mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-semibold">No materials matching "{query}"</p>
                  <p className="text-[10px] mt-0.5">Press Escape or Backspace to clear</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableMaterialSelect;
