// Template.tsx
import React, { useState, useRef, useEffect } from "react";
import { Plus, Funnel, ChevronDown } from "lucide-react";

interface TemplateProps {
    title: string;
    subtitle?: string;
    totalCount?: number;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    filters?: string[];
    selectedFilter?: string | null;
    onFilterSelect?: (filter: string) => void;
    buttonText?: string;
    onButtonClick?: () => void;
}

const Template: React.FC<TemplateProps> = ({
    title,
    subtitle,
    totalCount = 0,
    searchPlaceholder = "Search",
    onSearchChange,
    filters = ["All", "Ongoing", "Pending", "Completed"],
    selectedFilter: selectedFilterProp = null,
    onFilterSelect,
    buttonText = "Add",
    onButtonClick,
}) => {
    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState<string | null>(
        selectedFilterProp
    );

    const filterRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        if (onSearchChange) onSearchChange(e.target.value);
    };

    const handleFilterSelect = (filter: string) => {
        setSelectedFilter(filter);
        setFilterOpen(false);
        if (onFilterSelect) onFilterSelect(filter);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
                    {subtitle && <p className="text-gray-500 text-sm sm:text-base mt-1">{subtitle}</p>}
                </div>
            </div>

            {/* Controls */}
            {/* Desktop Layout */}
            <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
                {/* Left: Total Count */}
                <div className="flex items-center gap-3">
                    <span className="text-black font-semibold text-lg">{title}</span>
                    <span className="text-gray-500 font-medium text-lg">{totalCount}</span>
                </div>

                {/* Right: Search, Filters, Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={handleSearchChange}
                        className="border border-gray-300 rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
                    />

                    {/* Filters */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-2 border border-gray-300 px-4 py-3 rounded-md hover:bg-gray-100 transition text-base"
                        >
                            <Funnel size={18} />
                            {selectedFilter || "Filters"}
                            <ChevronDown size={16} className="ml-1" />
                        </button>

                        {filterOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                                {filters.map((filter) => (
                                    <div
                                        key={filter}
                                        onClick={() => handleFilterSelect(filter)}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                                    >
                                        {filter}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onButtonClick}
                        className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-md hover:bg-gray-800 transition text-base"
                    >
                        <Plus size={18} />
                        {buttonText}
                    </button>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="flex sm:hidden flex-col gap-3 mt-4">
                {/* Search + Filter + Button in one row */}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={handleSearchChange}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
                    />
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className="border border-gray-300 rounded-md p-2 hover:bg-gray-100 transition"
                    >
                        <Funnel size={16} />
                    </button>
                    <button
                        onClick={onButtonClick}
                        className="bg-black text-white rounded-md px-3 py-2 hover:bg-gray-800 transition flex items-center gap-1 text-sm"
                    >
                        <Plus size={14} />
                        {buttonText}
                    </button>
                </div>

                {/* Mobile Filter Dropdown */}
                {filterOpen && (
                    <div className="w-full bg-white border border-gray-300 rounded-md shadow-md mt-2">
                        {filters.map((filter) => (
                            <div
                                key={filter}
                                onClick={() => handleFilterSelect(filter)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 text-sm"
                            >
                                {filter}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Template;
