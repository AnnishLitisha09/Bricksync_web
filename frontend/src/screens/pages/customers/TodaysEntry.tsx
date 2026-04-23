import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle, AlertCircle, FileText, Loader2, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL, getAuthHeader } from "../../../api/base";
import { fetchVehicles } from "../../../api/vehicle";
import { fetchCustomers } from "../../../api/customer";
import { getEmployees, getAllOffices, getAllProducts } from "../../../api/inventory";
import { createOrder } from "../../../api/order";
import SearchableSelect from "../../../components/common/SearchableSelect";
import { Plus, Users, MapPin, Package, Building2, IndianRupee, Hash, Trash2, Save } from "lucide-react";
import { toast } from "react-hot-toast";

function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return 0;
  if (na.includes(nb) || nb.includes(na)) return 1;
  const longer = na.length >= nb.length ? na : nb;
  const shorter = na.length < nb.length ? na : nb;
  let matches = 0;
  let start = 0;
  for (const ch of shorter) {
    const idx = longer.indexOf(ch, start);
    if (idx !== -1) {
      matches++;
      start = idx + 1;
    }
  }
  return matches / longer.length;
}

interface Entry {
  sl_no: number;
  raw_customer: string | null;
  matched_customer: string | null;
  customer_status: "verified" | "unverified";
  place_of_delivery: string | null;
  material: string | null;
  qty: string | null;
  // New fields
  office_id: string;
  rate: string;
  driver_ids: number[];
  loader_ids: number[];
  loader_charge: string;
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

  // Lists for dropdowns
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Load lists on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [v, c, e, o, p] = await Promise.all([
          fetchVehicles(),
          fetchCustomers("", 1, 1000),
          getEmployees(),
          getAllOffices(),
          getAllProducts()
        ]);
        setVehicles(v || []);
        setCustomers(c.data || []);
        setEmployees(e.data || []);
        setOffices(o.data || []);
        setProducts(p.data || []);
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    };
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const updateEntry = (idx: number, field: keyof Entry, value: string) => {
    if (!result) return;
    const newEntries = [...result.entries];
    newEntries[idx] = { ...newEntries[idx], [field]: value } as Entry;
    setResult({ ...result, entries: newEntries });
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
        let extractedData: OCRResult = data.data;

        // Perform similarity matching
        try {
          // The fetching is now done on mount, but we can still use the state here if needed.
          // However, the similarity matching logic can stay as is, just using the state.
          
          const currentVehicles = vehicles;
          const currentCustomers = customers;
          const currentEmployees = employees;

          // Vehicle Match
          if (extractedData.vehicle_number.raw) {
            let bestScore = 0;
            let bestMatch = "";
            for (const v of currentVehicles) {
              const score = nameSimilarity(extractedData.vehicle_number.raw, v.vehicleNumber || "");
              if (score > bestScore) { bestScore = score; bestMatch = v.vehicleNumber; }
            }
            if (bestScore >= 0.5) {
              extractedData.vehicle_number.matched = bestMatch;
              extractedData.vehicle_number.status = "verified";
            }
          }

          // Driver Match
          if (extractedData.driver_name.raw) {
            let bestScore = 0;
            let bestMatch = "";
            for (const e of currentEmployees) {
              // Only consider drivers if possible, but fallback to all employees if role checking is not strictly required.
              // Assuming e.employee_name is present
              const score = nameSimilarity(extractedData.driver_name.raw, e.employee_name || "");
              if (score > bestScore) { bestScore = score; bestMatch = e.employee_name; }
            }
            if (bestScore >= 0.5) {
              extractedData.driver_name.matched = bestMatch;
              extractedData.driver_name.status = "verified";
            }
          }

          // Map entries with default values for new fields
          extractedData.entries = extractedData.entries.map(entry => ({
            ...entry,
            office_id: "",
            rate: "",
            driver_ids: [],
            loader_ids: [],
            loader_charge: ""
          }));

          // Entries Match
          extractedData.entries = extractedData.entries.map(entry => {
            if (entry.raw_customer) {
              let bestScore = 0;
              let bestMatch = "";
              for (const c of currentCustomers) {
                const score = nameSimilarity(entry.raw_customer, c.name || "");
                if (score > bestScore) { bestScore = score; bestMatch = c.name; }
              }
              if (bestScore >= 0.5) {
                entry.matched_customer = bestMatch;
                entry.customer_status = "verified";
              }
            }
            return entry;
          });
        } catch (matchErr) {
          console.error("Failed to fetch matching data", matchErr);
        }

        setResult(extractedData);
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

      <div className="flex flex-col gap-8">
        {/* Top: Upload */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6">
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
                    <SearchableSelect
                      options={vehicles.map(v => ({ label: v.vehicleNumber, value: v.vehicleNumber, sublabel: v.vehicleName }))}
                      value={result.vehicle_number.matched || result.vehicle_number.raw || ""}
                      onChange={(val) => setResult({...result, vehicle_number: { ...result.vehicle_number, matched: val, status: "verified" }})}
                      placeholder="Vehicle"
                      className="w-full"
                    />
                    {result.vehicle_number.status === "verified" ? (
                      <CheckCircle size={18} className="text-green-500 shrink-0 ml-2" />
                    ) : (
                      <span title="Unverified" className="shrink-0 ml-2"><AlertCircle size={18} className="text-amber-500" /></span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Driver</p>
                  <div className="flex items-center justify-between">
                    <SearchableSelect
                      options={employees.map(e => ({ label: e.employee_name, value: e.employee_name, sublabel: e.role }))}
                      value={result.driver_name.matched || result.driver_name.raw || ""}
                      onChange={(val) => setResult({...result, driver_name: { ...result.driver_name, matched: val, status: "verified" }})}
                      placeholder="Driver"
                      className="w-full"
                    />
                    {result.driver_name.status === "verified" ? (
                      <CheckCircle size={18} className="text-green-500 shrink-0 ml-2" />
                    ) : (
                      <span title="Unverified" className="shrink-0 ml-2"><AlertCircle size={18} className="text-amber-500" /></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Entries (1-8)</h3>
                <div className="space-y-3 pr-2">
                  {result.entries.map((entry, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-2 relative">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 text-orange-600 font-black h-8 w-8 rounded-xl flex items-center justify-center shrink-0">
                          {entry.sl_no || idx + 1}
                        </div>
                        <div className="w-full">
                           <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-4">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Customer Name</p>
                               {entry.customer_status === "verified" ? (
                                 <span className="bg-green-100 text-green-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                               ) : (
                                 <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Review</span>
                               )}
                             </div>
                             {entry.customer_status === "unverified" && (
                               <button className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                 <Plus size={10} /> Add New
                               </button>
                             )}
                           </div>
                           <SearchableSelect
                             options={customers.map(c => ({ label: c.name, value: c.name, sublabel: c.phone_no }))}
                             value={entry.matched_customer || entry.raw_customer || ""}
                             onChange={(val) => {
                               const newEntries = [...result.entries];
                               newEntries[idx] = { ...newEntries[idx], matched_customer: val, customer_status: "verified" };
                               setResult({ ...result, entries: newEntries });
                             }}
                             placeholder="Customer"
                             className="w-full mb-3"
                           />
                           
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Place of Delivery</p>
                           <div className="flex items-center gap-2">
                             <MapPin size={14} className="text-slate-300 shrink-0" />
                             <input 
                               type="text"
                               className="text-sm font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 outline-none w-full"
                               value={entry.place_of_delivery || ""}
                               onChange={(e) => updateEntry(idx, 'place_of_delivery', e.target.value)}
                               placeholder="Place of Delivery"
                             />
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Dispatch Office</p>
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-slate-300 shrink-0" />
                            <select 
                              className="text-xs font-bold text-slate-700 bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 outline-none w-full"
                              value={entry.office_id}
                              onChange={(e) => updateEntry(idx, 'office_id' as any, e.target.value)}
                            >
                              <option value="">Select Office</option>
                              {offices.map(o => <option key={o.office_id} value={o.office_id}>{o.office_name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Material</p>
                          <div className="flex items-center gap-2">
                            <Package size={14} className="text-slate-300 shrink-0" />
                            <SearchableSelect
                              options={products.map(p => ({ label: p.product_name, value: p.product_name }))}
                              value={entry.material || ""}
                              onChange={(val) => updateEntry(idx, 'material', val)}
                              placeholder="Material"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Qty</p>
                          <div className="flex items-center gap-2">
                            <Hash size={14} className="text-slate-300 shrink-0" />
                            <input 
                              type="text"
                              className="text-xs font-bold text-slate-700 bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 outline-none w-full"
                              value={entry.qty || ""}
                              onChange={(e) => updateEntry(idx, 'qty', e.target.value)}
                              placeholder="Qty"
                            />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Rate</p>
                          <div className="flex items-center gap-2">
                            <IndianRupee size={14} className="text-slate-300 shrink-0" />
                            <input 
                              type="text"
                              className="text-xs font-bold text-slate-700 bg-transparent border-b border-dashed border-slate-300 focus:border-orange-500 outline-none w-full"
                              value={entry.rate || ""}
                              onChange={(e) => updateEntry(idx, 'rate' as any, e.target.value)}
                              placeholder="Rate"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus size={12} className="text-orange-500" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Staff & Charges</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                             <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Drivers</p>
                             <select 
                               className="text-xs font-bold text-slate-700 bg-transparent w-full outline-none"
                               onChange={(e) => {
                                 const eid = Number(e.target.value);
                                 if (eid && !entry.driver_ids.includes(eid)) {
                                   const newEntries = [...result.entries];
                                   newEntries[idx] = { ...newEntries[idx], driver_ids: [...entry.driver_ids, eid] };
                                   setResult({ ...result, entries: newEntries });
                                 }
                                 e.target.value = "";
                               }}
                             >
                                <option value="">+ Add Driver</option>
                                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                             </select>
                             <div className="flex flex-wrap gap-1 mt-2">
                               {entry.driver_ids.map(eid => (
                                 <span key={eid} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black flex items-center gap-1">
                                   {employees.find(e => e.employee_id === eid)?.employee_name}
                                   <Trash2 size={10} className="cursor-pointer" onClick={() => {
                                      const newEntries = [...result.entries];
                                      newEntries[idx] = { ...newEntries[idx], driver_ids: entry.driver_ids.filter(d => d !== eid) };
                                      setResult({ ...result, entries: newEntries });
                                   }}/>
                                 </span>
                               ))}
                             </div>
                           </div>

                           <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                             <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Loaders</p>
                             <select 
                               className="text-xs font-bold text-slate-700 bg-transparent w-full outline-none"
                               onChange={(e) => {
                                 const eid = Number(e.target.value);
                                 if (eid && !entry.loader_ids.includes(eid)) {
                                   const newEntries = [...result.entries];
                                   newEntries[idx] = { ...newEntries[idx], loader_ids: [...entry.loader_ids, eid] };
                                   setResult({ ...result, entries: newEntries });
                                 }
                                 e.target.value = "";
                               }}
                             >
                                <option value="">+ Add Loader</option>
                                {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.employee_name}</option>)}
                             </select>
                             <div className="flex flex-wrap gap-1 mt-2">
                               {entry.loader_ids.map(eid => (
                                 <span key={eid} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black flex items-center gap-1">
                                   {employees.find(e => e.employee_id === eid)?.employee_name}
                                   <Trash2 size={10} className="cursor-pointer" onClick={() => {
                                      const newEntries = [...result.entries];
                                      newEntries[idx] = { ...newEntries[idx], loader_ids: entry.loader_ids.filter(l => l !== eid) };
                                      setResult({ ...result, entries: newEntries });
                                   }}/>
                                 </span>
                               ))}
                             </div>
                           </div>

                           <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] uppercase text-slate-400 font-bold mb-1">Loader Charge</p>
                              <div className="flex items-center gap-2">
                                <IndianRupee size={12} className="text-slate-300 shrink-0" />
                                <input 
                                 type="text" 
                                 className="text-xs font-bold text-slate-700 bg-transparent w-full outline-none" 
                                 placeholder="Charge/Unit"
                                 value={entry.loader_charge}
                                 onChange={(e) => updateEntry(idx, 'loader_charge' as any, e.target.value)}
                                />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {result.entries.length === 0 && (
                    <p className="text-sm text-slate-500 italic text-center py-4">No entries detected.</p>
                  )}

                  <button
                    onClick={() => {
                      const newEntry: Entry = {
                        sl_no: result.entries.length + 1,
                        raw_customer: null,
                        matched_customer: null,
                        customer_status: "unverified",
                        place_of_delivery: null,
                        material: null,
                        qty: null,
                        office_id: "",
                        rate: "",
                        driver_ids: [],
                        loader_ids: [],
                        loader_charge: ""
                      };
                      setResult({ ...result, entries: [...result.entries, newEntry] });
                    }}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Another Material
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isProcessing}
                  onClick={async () => {
                    if (!result || result.entries.length === 0) return;
                    
                    const entriesByCustomer: { [key: string]: Entry[] } = {};
                    result.entries.forEach(entry => {
                      const custName = entry.matched_customer || entry.raw_customer;
                      if (!custName) return;
                      if (!entriesByCustomer[custName]) entriesByCustomer[custName] = [];
                      entriesByCustomer[custName].push(entry);
                    });

                    if (Object.keys(entriesByCustomer).length === 0) {
                      toast.error("No customers selected for entries");
                      return;
                    }

                    setIsProcessing(true);
                    try {
                      for (const custName of Object.keys(entriesByCustomer)) {
                        const custEntries = entriesByCustomer[custName];
                        const customer = customers.find(c => c.name === custName);
                        
                        if (!customer) {
                          toast.error(`Customer "${custName}" not found. Please add or select an existing customer.`);
                          continue;
                        }

                        const payload = {
                          cus_id: customer.id,
                          date: new Date().toISOString().split('T')[0],
                          transport_charge: 0,
                          items: custEntries.map(e => ({
                            product: e.material || "Material",
                            office_id: Number(e.office_id),
                            material_id: products.find(p => p.product_name === e.material)?.product_id,
                            quantity: Number(e.qty) || 0,
                            price: Number(e.rate) || 0,
                            vehicle_id: vehicles.find(v => v.vehicleNumber === result.vehicle_number.matched)?.id,
                            driver_ids: e.driver_ids,
                            loader_ids: e.loader_ids,
                            loader_charge_per_unit: Number(e.loader_charge) || 0,
                            places: e.place_of_delivery
                          }))
                        };
                        await createOrder(payload as any);
                      }
                      toast.success("All entries saved successfully!");
                      setResult(null);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to save entries");
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isProcessing ? "Saving..." : "Save All Entries"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
