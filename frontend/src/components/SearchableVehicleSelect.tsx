import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Truck, X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleName: string;
  kilometer?: number;
}

interface SearchableVehicleSelectProps {
  vehicles: Vehicle[];
  value: string | number;
  onChange: (vehicleId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelectNext?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

const SearchableVehicleSelect: React.FC<SearchableVehicleSelectProps> = ({
  vehicles,
  value,
  onChange,
  placeholder = "Search or pick vehicle...",
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

  // Selected vehicle object
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(value)),
    [vehicles, value]
  );

  // Filter vehicles based on query
  const filteredVehicles = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return vehicles;
    const terms = term.split(/\s+/).filter(Boolean);
    return vehicles.filter((v) => {
      const num = v.vehicleNumber.toLowerCase();
      const name = (v.vehicleName || "").toLowerCase();
      return terms.every((t) => num.includes(t) || name.includes(t));
    });
  }, [vehicles, query]);

  // Reset selectedIndex when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredVehicles.length, query]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLDivElement>("[data-vehicle-item]");
    if (items[selectedIndex]) {
      items[selectedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, isOpen]);

  // Click outside listener
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

  const handleSelect = (id: number) => {
    onChange(String(id));
    setIsOpen(false);
    setQuery("");
    if (onSelectNext) {
      setTimeout(onSelectNext, 40);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
    // Select all existing text so typing immediately replaces it
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
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(filteredVehicles.length - 1, 0)));
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
      if (isOpen && filteredVehicles.length > 0) {
        const target = filteredVehicles[selectedIndex] || filteredVehicles[0];
        if (target) {
          handleSelect(target.id);
          return;
        }
      }

      // If dropdown is closed but vehicle is already selected, advance to next field
      if (selectedVehicle) {
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
      if (isOpen && filteredVehicles.length > 0 && query.trim()) {
        const target = filteredVehicles[selectedIndex] || filteredVehicles[0];
        if (target) {
          handleSelect(target.id);
        }
      }
      setIsOpen(false);
      setQuery("");
    }
  };

  // Determine displayed input value
  const displayValue = isOpen
    ? query
    : selectedVehicle
    ? `${selectedVehicle.vehicleNumber}${selectedVehicle.vehicleName ? ` • ${selectedVehicle.vehicleName}` : ""}`
    : "";

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
              selectedVehicle ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Truck size={14} />
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
              placeholder={
                selectedVehicle
                  ? `${selectedVehicle.vehicleNumber} ${selectedVehicle.vehicleName || ""}`
                  : placeholder
              }
              className={`w-full bg-transparent outline-none text-xs uppercase ${
                selectedVehicle && !isOpen ? "font-bold text-slate-800" : "font-semibold text-slate-800"
              } placeholder:text-slate-400`}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedVehicle && !disabled && (
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
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{query ? `Filtering for "${query}"` : "Type vehicle number to filter"}</span>
              <span>{filteredVehicles.length} vehicles</span>
            </div>

            {/* Vehicle List */}
            <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  const isCurrent = String(v.id) === String(value);
                  return (
                    <div
                      key={v.id}
                      data-vehicle-item
                      onClick={() => handleSelect(v.id)}
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
                          <Truck size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase truncate leading-tight">
                            {v.vehicleNumber}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {v.vehicleName || "Fleet Truck"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {v.kilometer !== undefined && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {v.kilometer.toLocaleString()} KM
                          </span>
                        )}
                        {isCurrent && <Check size={14} className="text-indigo-600 ml-1" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400">
                  <AlertCircle size={20} className="mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold">No vehicles match "{query}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableVehicleSelect;
