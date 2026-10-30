import React from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";

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
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                onClick={onClose}
            />
            <div
                className="relative bg-white w-full max-w-md p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5 z-10 animate-in zoom-in-95 duration-150 border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="size-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <Trash2 size={20} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-black text-slate-900">{title}</h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex gap-2.5 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
                    >
                        Delete Now
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmationModal;
