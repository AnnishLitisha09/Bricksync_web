import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, FileText, Calendar, Hash, ArrowLeft, ArrowRight, ExternalLink, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL, FILE_BASE_URL, getAuthHeader } from '../../../api/base';
import toast from 'react-hot-toast';

interface NotepadRecord {
    id: number;
    verifiedId: string;
    title: string;
    phone: string;
    email: string;
    pdfPath: string;
    filename?: string;
    createdAt: string;
}

const NotepadHistory: React.FC = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<NotepadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 10;

    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${BASE_URL}/notepad/all?page=${page}&limit=${limit}&search=${search}`,
                { headers: getAuthHeader() }
            );
            const result = await response.json();
            if (result.success) {
                setRecords(result.data);
                setTotalPages(result.totalPages);
                setTotalRecords(result.total);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const getPdfUrl = (record: NotepadRecord) => {
        if (record.filename) return `${FILE_BASE_URL}/notepad/${record.filename}`;
        if (record.pdfPath) return `${FILE_BASE_URL}${record.pdfPath.replace('/pdfs/', '/notepad/').replace('/pdf/', '/notepad/')}`;
        return null;
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchRecords();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [fetchRecords]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Document History</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Showing total <span className="font-bold text-indigo-600">{totalRecords}</span> generated bill records
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/notepad')}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={18} />
                        Create New Bill
                    </button>
                </div>
            </div>

            {/* Stats & Search Bar */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Verified ID, Title, Phone or Email..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verified ID</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">File Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Generated On</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={5} className="px-6 py-4">
                                                <div className="h-4 bg-slate-100 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : records.length > 0 ? (
                                    records.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                                        <Hash size={14} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{record.verifiedId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-800 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">{record.filename || '---'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-600 font-medium">{record.phone}</span>
                                                    <span className="text-[10px] text-slate-400">{record.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Calendar size={14} />
                                                    <span className="text-xs">{new Date(record.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {getPdfUrl(record) ? (
                                                    <a
                                                        href={getPdfUrl(record)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-xs bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                                    >
                                                        <ExternalLink size={14} />
                                                        View PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 italic">No File</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                    <FileText size={32} />
                                                </div>
                                                <p className="text-slate-500 font-medium font-bold">No records found</p>
                                                <p className="text-slate-400 text-xs">Try adjusting your search or create a new bill.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotepadHistory;
