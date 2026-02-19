import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    label: string;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    label
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {label}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-all shadow-sm"
                >
                    <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === page
                            ? "bg-slate-900 text-white shadow-lg"
                            : "bg-white text-slate-400 border border-slate-100 hover:border-indigo-500 hover:text-indigo-600 shadow-sm"
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:text-indigo-600 transition-all shadow-sm"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
