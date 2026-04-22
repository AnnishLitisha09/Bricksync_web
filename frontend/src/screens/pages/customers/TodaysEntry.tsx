import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertCircle, FileText, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL, getAuthHeader } from "../../../api/base";

interface Entry {
  sl_no: number;
  raw_customer: string | null;
  matched_customer: string | null;
  customer_status: "verified" | "unverified";
  place_of_delivery: string | null;
  material: string | null;
  qty: string | null;
}

interface OCRResult {
  vehicle_number: { raw: string | null; matched: string | null; status: string };
  driver_name: { raw: string | null; matched: string | null; status: string };
  entries: Entry[];
}

export default function TodaysEntry() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch(`${BASE_URL}/todays-entry/extract`, {
        method: "POST",
        headers: getAuthHeader(true),
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || "Failed to process image.");
      }
    } catch (err) {
      setError("An error occurred while communicating with the offline AI.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Today's Entry</h1>
          <p className="text-slate-500 mt-1">Upload a daily entry notebook page for AI-powered extraction.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload */}
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ minHeight: "300px" }}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <>
                <UploadCloud size={48} className="text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium">Click or drag image to upload</p>
                <p className="text-slate-400 text-sm mt-2">Supports JPG, PNG</p>
              </>
            )}
            {previewUrl && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-full">Change Image</p>
              </div>
            )}
          </div>

          <button
            disabled={!selectedFile || isProcessing}
            onClick={processImage}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Processing with AI...
              </>
            ) : (
              <>
                <Play size={20} /> Extract Data
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6"
            >
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <FileText className="text-orange-500" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Extracted Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vehicle</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-800">
                      {result.vehicle_number.matched || result.vehicle_number.raw || "Not Found"}
                    </p>
                    {result.vehicle_number.status === "verified" ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <span title="Unverified"><AlertCircle size={18} className="text-amber-500" /></span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Driver</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-800">
                      {result.driver_name.matched || result.driver_name.raw || "Not Found"}
                    </p>
                    {result.driver_name.status === "verified" ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <span title="Unverified"><AlertCircle size={18} className="text-amber-500" /></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Entries (1-8)</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.entries.map((entry, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative">
                      <div className="absolute top-4 right-4">
                        {entry.customer_status === "verified" ? (
                           <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Verified</span>
                        ) : (
                           <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Review</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 text-orange-600 font-black h-8 w-8 rounded-xl flex items-center justify-center shrink-0">
                          {entry.sl_no || idx + 1}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-800">{entry.matched_customer || entry.raw_customer || "Unknown Party"}</p>
                           {entry.place_of_delivery && (
                             <p className="text-xs text-slate-500">{entry.place_of_delivery}</p>
                           )}
                        </div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Material</p>
                          <p className="text-sm font-semibold text-slate-700">{entry.material || "-"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Qty</p>
                          <p className="text-sm font-semibold text-slate-700">{entry.qty || "-"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.entries.length === 0 && (
                    <p className="text-sm text-slate-500 italic text-center py-4">No entries detected.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
