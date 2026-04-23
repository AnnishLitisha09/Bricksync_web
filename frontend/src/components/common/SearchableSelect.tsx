import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchableSelectProps {
  options: { label: string; value: string; sublabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  className = "",
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(term))
    );
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearch("");
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        onClick={handleOpen}
        className={`w-full bg-transparent border-b border-dashed flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? "border-orange-500" : "border-slate-300 hover:border-slate-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden py-1">
          {icon && <div className="shrink-0">{icon}</div>}
          {isOpen ? (
            <input
              autoFocus
              className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-300 text-sm font-medium"
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`truncate text-sm font-bold ${selectedOption ? "text-slate-800" : "text-slate-400"}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-orange-500" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-[100] w-full mt-1 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden"
            style={{ minWidth: "200px" }}
          >
            <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${opt.value === value ? "bg-orange-50 text-orange-600" : "hover:bg-slate-50 text-slate-700"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{opt.label}</p>
                      {opt.sublabel && <p className="text-[10px] text-slate-400 truncate">{opt.sublabel}</p>}
                    </div>
                    {opt.value === value && <Check size={12} />}
                  </div>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No results</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;
