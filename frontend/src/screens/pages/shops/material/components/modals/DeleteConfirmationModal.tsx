import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl space-y-6"
                    >
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900">{title}</h3>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed">{message}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                            >
                                Delete Now
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeleteConfirmationModal;
