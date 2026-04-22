import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Truck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  vehicleName: string;
  kilometer: number;
}

interface SearchableVehicleSelectProps {
  vehicles: Vehicle[];
  value: string | number;
  onChange: (vehicleId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableVehicleSelect: React.FC<SearchableVehicleSelectProps> = ({
  vehicles,
  value,
  onChange,
  placeholder = "Search Vehicle Number...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the currently selected vehicle object
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === String(value)),
    [vehicles, value]
  );

  // Filter vehicles based on search text
  const filteredVehicles = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return vehicles;
    return vehicles.filter(
      (v) =>
        v.vehicleNumber.toLowerCase().includes(term) ||
        v.vehicleName.toLowerCase().includes(term)
    );
  }, [vehicles, search]);

  // Handle auto-selection when only one vehicle remains in the filtered list
  useEffect(() => {
    if (isOpen && search.trim() !== "" && filteredVehicles.length === 1) {
      // Small timeout to ensure it doesn't feel too jumpy while typing
      const timer = setTimeout(() => {
        handleSelect(filteredVehicles[0].id);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filteredVehicles, search, isOpen]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When dropdown opens, reset search to empty if nothing is selected or current number if one is
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearch("");
  };

  const handleSelect = (id: number) => {
    onChange(String(id));
    setIsOpen(false);
    setSearch("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Input / Display Area */}
      <div
        onClick={handleOpen}
        className={`w-full bg-gray-50 border-2 rounded-2xl px-4 py-3 text-sm font-bold flex items-center justify-between transition-all cursor-pointer shadow-sm
          ${isOpen ? "border-orange-500 bg-white ring-4 ring-orange-50" : "border-transparent"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-200"}`}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <Truck size={16} className={selectedVehicle ? "text-orange-500" : "text-gray-400"} />
          {isOpen ? (
            <input
              autoFocus
              className="w-full bg-transparent outline-none text-slate-700 placeholder:text-gray-300"
              placeholder="Type to filter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`truncate ${selectedVehicle ? "text-slate-900" : "text-gray-400 font-medium"}`}>
              {selectedVehicle ? `${selectedVehicle.vehicleNumber} (${selectedVehicle.vehicleName})` : placeholder}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!disabled && selectedVehicle && !isOpen && (
            <button onClick={clearSelection} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-orange-500" : ""}`}
          />
        </div>
      </div>

      {/* Floating Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-3xl border border-gray-100 shadow-2xl p-2 max-h-[300px] overflow-y-auto"
          >
            {filteredVehicles.length > 0 ? (
              <div className="space-y-1">
                {filteredVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelect(v.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all group
                      ${String(v.id) === String(value) ? "bg-orange-50 border border-orange-100" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div>
                      <p className={`text-sm font-black uppercase tracking-tight ${String(v.id) === String(value) ? "text-orange-600" : "text-slate-900"}`}>
                        {v.vehicleNumber}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{v.vehicleName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Odometer</p>
                      <p className="text-[11px] font-bold text-slate-600">{v.kilometer.toLocaleString()} KM</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <Search size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No match for "{search}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableVehicleSelect;
