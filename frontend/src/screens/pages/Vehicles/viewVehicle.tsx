import { AlertCircle, ArrowLeft, Camera, Edit, History, X, Fuel, Wrench, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import Input from "../../../components/InputBox";
import { useVehicleStore, type Vehicle } from "../../../store/vechicle/useVehicleStore";
import { decryptId } from "../../../utils/functions";
import { formatDate } from "../../../utils/formatDate";
import LottieLoader from "../../../components/common/LottieLoader";

type DocKey = "vehicleImage" | "rcImage" | "insuranceImage" | "pollutionImage" | "speedImage";
type HistoryTab = "All" | "Fuel" | "Services" | "Spares";

export default function ViewVehicle() {
    const { hashId } = useParams();
    const navigate = useNavigate();
    const { fetchVehicleById, updateVehicle } = useVehicleStore();

    const [vehicle, setVehicle] = useState<Vehicle>({} as Vehicle);
    const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
    const vehicleImageRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<HistoryTab>("All");

    const [docFiles, setDocFiles] = useState<Record<DocKey, File | null>>({
        vehicleImage: null, rcImage: null, insuranceImage: null, pollutionImage: null, speedImage: null,
    });

    const [docPreviews, setDocPreviews] = useState<Record<DocKey, string | null>>({
        vehicleImage: null, rcImage: null, insuranceImage: null, pollutionImage: null, speedImage: null,
    });

    const [loading, setLoading] = useState(true);
    const [isEdit, setEdit] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadVehicle = async () => {
            try {
                const id = decryptId(hashId!);
                if (!id) throw new Error("Invalid ID");
                const data = await fetchVehicleById(id);
                setVehicle(data);
                setOriginalVehicle(data);
            } catch (error) {
                toast.error("Vehicle not found");
                navigate("/vehicles");
            } finally {
                setLoading(false);
            }
        };
        loadVehicle();
    }, [hashId, fetchVehicleById, navigate]);

    // Consolidate all history items
    const allHistory = useMemo(() => {
        const fuels = (vehicle.vehicleFuels || []).map(f => ({ ...f, type: "Fuel", amount: f.amount, info: f.fuelBunk?.name || "Bunk Log" }));
        const services = (vehicle.services || []).map(s => ({ ...s, type: "Services", amount: s.amount, info: s.serviceShop?.name || s.topic }));
        const spares = (vehicle.sparesTitles || []).map(sp => ({ ...sp, type: "Spares", amount: Number(sp.bill_amount) || 0, info: sp.name }));

        return [...fuels, ...services, ...spares].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [vehicle]);

    const filteredHistory = useMemo(() => {
        if (activeTab === "All") return allHistory;
        return allHistory.filter(h => h.type === activeTab);
    }, [allHistory, activeTab]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVehicle(prev => ({ ...prev, [name]: value }));
    };

    const handleDocSelect = (key: DocKey, file: File) => {
        setDocFiles(prev => ({ ...prev, [key]: file }));
        const url = URL.createObjectURL(file);
        setDocPreviews(prev => ({ ...prev, [key]: url }));
    };

    const handleCancel = () => {
        if (originalVehicle) setVehicle(originalVehicle);
        setDocFiles({ vehicleImage: null, rcImage: null, insuranceImage: null, pollutionImage: null, speedImage: null });
        setDocPreviews({ vehicleImage: null, rcImage: null, insuranceImage: null, pollutionImage: null, speedImage: null });
        setEdit(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("vehicleName", vehicle.vehicleName);
            formData.append("vehicleNumber", vehicle.vehicleNumber);
            formData.append("kilometer", String(vehicle.kilometer));
            formData.append("insurance", vehicle.insurance ?? "");
            formData.append("pollution", vehicle.pollution ?? "");
            formData.append("rcDate", vehicle.rcDate ?? "");

            (Object.keys(docFiles) as DocKey[]).forEach(key => {
                if (docFiles[key]) formData.append(key, docFiles[key]!);
            });

            await updateVehicle(vehicle.id, formData);
            toast.success("Vehicle updated successfully");
            setEdit(false);
        } catch (err) {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = useMemo(() => {
        if (!originalVehicle) return false;
        const fieldsChanged = JSON.stringify(vehicle) !== JSON.stringify(originalVehicle);
        const fileChanged = Object.values(docFiles).some(file => file !== null);
        return fieldsChanged || fileChanged;
    }, [vehicle, originalVehicle, docFiles]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFDFD]">
            <LottieLoader
                type="truck"
                message="Acquiring Vehicle Telemetry"
                size={300}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-12 animate-in fade-in duration-700">

                {/* HEADER SECTION --- same as before --- */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="group p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-orange-200 transition-all active:scale-90">
                            <ArrowLeft size={22} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                        </button>
                        <div>
                            {isEdit ? (
                                <input name="vehicleName" className="w-full text-2xl md:text-4xl font-black bg-white border-b-4 border-orange-500 focus:outline-none rounded-t-lg px-2" value={vehicle.vehicleName} onChange={handleChange} autoFocus />
                            ) : (
                                <>
                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">{vehicle.vehicleName}</h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="font-mono text-[11px] font-bold bg-orange-500 text-white px-3 py-1 rounded-lg shadow-lg shadow-orange-200 uppercase tracking-wider">{vehicle.vehicleNumber}</span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Fleet</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Actions same as before */}
                    <div className="hidden md:flex items-center gap-3">
                        {isEdit ? (
                            <>
                                <button onClick={handleCancel} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-gray-500 bg-white border border-gray-100 hover:bg-gray-50 transition-all"><X size={18} /> Cancel</button>
                                <button onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-100 disabled:opacity-50 transition-all">{saving ? "Saving..." : "Save Changes"}</button>
                            </>
                        ) : (
                            <button onClick={() => setEdit(true)} className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-bold text-white bg-gray-900 hover:bg-black shadow-2xl shadow-gray-300 transition-all active:scale-95"><Edit size={18} /> Edit Vehicle</button>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: Master photo */}
                    <div className="lg:col-span-5">
                        <div className="group relative aspect-square lg:aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-100 border-[6px] border-white shadow-2xl">
                            <img src={docPreviews.vehicleImage || (vehicle.vehicleImage ? `${FILE_BASE_URL}${vehicle.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800")} className="w-full h-full object-cover" alt="Vehicle" />
                            {isEdit && <div onClick={() => vehicleImageRef.current?.click()} className="absolute inset-0 bg-orange-600/40 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-pointer"><Camera size={32} /></div>}
                        </div>
                    </div>

                    {/* RIGHT: Specs */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <Input label="Reg. Number" name="vehicleNumber" disabled={!isEdit} value={vehicle.vehicleNumber} onChange={handleChange} />
                                <Input label="Current Odometer" name="kilometer" type="number" disabled={!isEdit} value={String(vehicle.kilometer ?? "")} onChange={handleChange} />
                                <Input label="Insurance" name="insurance" type="date" disabled={!isEdit} value={vehicle.insurance?.slice(0, 10) ?? ""} onChange={handleChange} />
                                <Input label="Pollution (PUC)" name="pollution" type="date" disabled={!isEdit} value={vehicle.pollution?.slice(0, 10) ?? ""} onChange={handleChange} />
                                <div className="sm:col-span-2">
                                    <Input label="RC Registration Date" name="rcDate" type="date" disabled={!isEdit} value={vehicle.rcDate?.slice(0, 10) ?? ""} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* REGULATORY DOCUMENTS */}
                <section>
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="font-black text-gray-800 uppercase tracking-[0.2em] text-xs px-2">Regulatory Documents</h3>
                        <div className="flex-1 h-px bg-gray-100"></div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <DocCard isEdit={isEdit} img={vehicle.rcImage} label="RC File" preview={docPreviews.rcImage} onSelect={file => handleDocSelect("rcImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.insuranceImage} label="Insurance" preview={docPreviews.insuranceImage} onSelect={file => handleDocSelect("insuranceImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.pollutionImage} label="Pollution" preview={docPreviews.pollutionImage} onSelect={file => handleDocSelect("pollutionImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.speedImage} label="Speed Cert" preview={docPreviews.speedImage} onSelect={file => handleDocSelect("speedImage", file)} />
                    </div>
                </section>

                {/* TOTAL AMOUNT TRACKER */}
                <section className="bg-gray-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <History size={200} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">System Asset Performance</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Total Amount <br/><span className="text-orange-500">Tracker</span></h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Cumulative Spend</p>
                            <span className="text-4xl md:text-6xl font-black tracking-tighter text-emerald-400">₹ {(vehicle.totalCost || 0).toLocaleString('en-IN')}</span>
                            <div className="flex justify-end gap-2 mt-4">
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest">
                                    Fuel: <span className="text-emerald-400">₹{Number(allHistory.filter(h => h.type === "Fuel").reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest">
                                    Service: <span className="text-emerald-400">₹{Number(allHistory.filter(h => h.type === "Services").reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRANSACTION HISTORY CATEGORIZED */}
                <section className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Activity <span className="text-orange-500">Timeline</span></h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Lifecycle event logs for this asset</p>
                        </div>
                        <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] gap-1">
                            {["All", "Fuel", "Services", "Spares"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as HistoryTab)}
                                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white text-gray-900 shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-xl shadow-gray-100/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Category</th>
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Event Info</th>
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date Recorded</th>
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ref / Odometer</th>
                                        <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredHistory.length > 0 ? (
                                        filteredHistory.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="py-6 px-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl border ${
                                                            item.type === "Fuel" ? "bg-orange-50 border-orange-100 text-orange-500" :
                                                            item.type === "Services" ? "bg-blue-50 border-blue-100 text-blue-500" :
                                                            "bg-emerald-50 border-emerald-100 text-emerald-500"
                                                        }`}>
                                                            {item.type === "Fuel" ? <Fuel size={14} /> : item.type === "Services" ? <Wrench size={14} /> : <Settings size={14} />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{item.type}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-8">
                                                    <p className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{item.info}</p>
                                                    {item.topic && <p className="text-[9px] font-bold text-gray-400 mt-0.5">{item.topic}</p>}
                                                </td>
                                                <td className="py-6 px-8 whitespace-nowrap">
                                                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter px-3 py-1 rounded-lg bg-gray-50 border border-gray-100">{formatDate(item.date)}</span>
                                                </td>
                                                <td className="py-6 px-8 text-gray-400 font-mono text-[11px]">
                                                    {item.kilometer ? `${item.kilometer} KM` : "---"}
                                                </td>
                                                <td className="py-6 px-8 text-right">
                                                    <span className="text-[11px] font-black text-gray-900 tracking-tighter">₹ {Number(item.amount).toLocaleString('en-IN')}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mx-auto mb-4 border border-gray-100">
                                                    <History size={28} />
                                                </div>
                                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">No transaction history found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}


const DocCard = ({ label, img, preview, onSelect, isEdit }: { label: string; img?: string; preview?: string | null; onSelect: (file: File) => void; isEdit: boolean; }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasImage = preview || img;

    return (
        <div className="flex flex-col gap-4 group">
            <div onClick={() => isEdit && inputRef.current?.click()} className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden transition-all duration-500 ${isEdit ? 'cursor-pointer ring-2 ring-dashed ring-orange-200 hover:ring-orange-500 bg-orange-50/30' : 'bg-white shadow-xl ring-1 ring-gray-100'} ${!hasImage && !isEdit ? 'bg-gray-50 flex items-center justify-center' : ''}`}>
                {hasImage ? (
                    <img src={preview || `${FILE_BASE_URL}${img}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={label} />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300 p-4 text-center">
                        <AlertCircle size={32} strokeWidth={1} />
                        <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Missing</span>
                    </div>
                )}
                {isEdit && <div className="absolute inset-0 bg-orange-600/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"><div className="bg-white p-4 rounded-full shadow-2xl text-orange-600"><Camera size={20} /></div></div>}
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])} />
            </div>
            <div className="text-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block truncate px-2">{label}</span>
            </div>
        </div>
    );
};