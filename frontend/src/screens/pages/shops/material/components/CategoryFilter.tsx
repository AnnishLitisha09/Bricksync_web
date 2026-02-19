import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CategoryFilterProps {
    show: boolean;
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
    show,
    categories,
    activeCategory,
    onCategoryChange
}) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-7xl mx-auto overflow-hidden"
                >
                    <div className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-white flex flex-wrap gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => onCategoryChange(cat)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border ${activeCategory === cat
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CategoryFilter;
