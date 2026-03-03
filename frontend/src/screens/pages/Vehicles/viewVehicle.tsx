/* eslint-disable @typescript-eslint/no-unused-vars */
import { AlertCircle, ArrowLeft, Camera, Edit, FileText, MapPin, Save, ShieldCheck, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import Input from "../../../components/InputBox";
import { useVehicleStore, type Vehicle } from "../../../store/vechicle/useVehicleStore";
import { decryptId } from "../../../utils/functions";
import { formatDate } from "../../../utils/formatDate";

type DocKey = "vehicleImage" | "rcImage" | "insuranceImage" | "pollutionImage" | "speedImage";

export default function ViewVehicle() {
    const { hashId } = useParams();
    const navigate = useNavigate();
    const { fetchVehicleById, updateVehicle } = useVehicleStore();

    const [vehicle, setVehicle] = useState<Vehicle>({} as Vehicle);
    const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
    const vehicleImageRef = useRef<HTMLInputElement>(null);

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
        <div className="flex h-[80vh] items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24 md:pb-12">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-700">

                {/* HEADER SECTION */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="group p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-orange-200 transition-all active:scale-90"
                        >
                            <ArrowLeft size={22} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                        </button>
                        <div>
                            {isEdit ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] px-1">Editing Mode</span>
                                    <input
                                        name="vehicleName"
                                        className="w-full text-2xl md:text-4xl font-black bg-white border-b-4 border-orange-500 focus:outline-none rounded-t-lg px-2"
                                        value={vehicle.vehicleName}
                                        onChange={handleChange}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                                        {vehicle.vehicleName}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="font-mono text-[11px] font-bold bg-orange-500 text-white px-3 py-1 rounded-lg shadow-lg shadow-orange-200 uppercase tracking-wider">
                                            {vehicle.vehicleNumber}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active Fleet</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {isEdit ? (
                            <>
                                <button onClick={handleCancel} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-gray-500 bg-white border border-gray-100 hover:bg-gray-50 transition-all">
                                    <X size={18} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasChanges || saving}
                                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-100 disabled:opacity-50 transition-all"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Changes</>}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) {
                                            try {
                                                await useVehicleStore.getState().deleteVehicle(vehicle.id);
                                                toast.success("Vehicle deleted successfully");
                                                navigate("/vehicles");
                                            } catch (err) {
                                                toast.error("Failed to delete vehicle");
                                            }
                                        }
                                    }}
                                    className="p-4 rounded-[1.5rem] font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all active:scale-95"
                                    title="Delete Vehicle"
                                >
                                    <AlertCircle size={20} />
                                </button>
                                <button onClick={() => setEdit(true)} className="flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-bold text-white bg-gray-900 hover:bg-black shadow-2xl shadow-gray-300 transition-all active:scale-95">
                                    <Edit size={18} strokeWidth={2.5} /> Edit Vehicle
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* LEFT: HERO IMAGE */}
                    <div className="lg:col-span-5">
                        <div className="group relative aspect-square sm:aspect-video lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-gray-100 shadow-2xl border-[6px] border-white">
                            <img
                                src={docPreviews.vehicleImage || (vehicle.vehicleImage ? `${FILE_BASE_URL}${vehicle.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800")}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                alt="Vehicle"
                            />
                            {isEdit && (
                                <div
                                    onClick={() => vehicleImageRef.current?.click()}
                                    className="absolute inset-0 bg-orange-600/40 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-pointer animate-in fade-in duration-300"
                                >
                                    <div className="bg-white p-5 rounded-full mb-4 shadow-2xl transform transition-transform group-active:scale-90">
                                        <Camera size={32} className="text-orange-500" />
                                    </div>
                                    <span className="font-black uppercase tracking-[0.2em] text-[11px]">Replace Master Photo</span>
                                </div>
                            )}
                            {/* Overlay info for mobile */}
                            {!isEdit && (
                                <div className="absolute bottom-6 left-6 right-6 md:hidden">
                                    <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-2xl">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Odometer Reading</p>
                                            <p className="font-mono font-black text-orange-600">{vehicle.kilometer} KM</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input ref={vehicleImageRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleDocSelect("vehicleImage", e.target.files[0])} />
                    </div>

                    {/* RIGHT: TECH SPECS */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-xl shadow-gray-500/5 flex-1">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                                    <Zap size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-xl italic">Performance & Specs</h3>
                                    <div className="h-1 w-12 bg-orange-500 rounded-full mt-1"></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8">
                                <div className="space-y-2">
                                    <Input label="Reg. Number" name="vehicleNumber" disabled={!isEdit} value={vehicle.vehicleNumber} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Input label="Current Odometer" name="kilometer" type="number" disabled={!isEdit} value={String(vehicle.kilometer ?? "")} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Input label="Insurance Expiry" name="insurance" type="date" disabled={!isEdit} value={vehicle.insurance?.slice(0, 10) ?? ""} onChange={handleChange} />
                                    {!isEdit && <p className="text-[10px] font-bold text-gray-500 mt-1 px-1">{formatDate(vehicle.insurance)}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Input label="PUC Expiry" name="pollution" type="date" disabled={!isEdit} value={vehicle.pollution?.slice(0, 10) ?? ""} onChange={handleChange} />
                                    {!isEdit && <p className="text-[10px] font-bold text-gray-500 mt-1 px-1">{formatDate(vehicle.pollution)}</p>}
                                </div>
                                <div className="sm:col-span-2 pt-4">
                                    <Input label="RC Registration Date" name="rcDate" type="date" disabled={!isEdit} value={vehicle.rcDate?.slice(0, 10) ?? ""} onChange={handleChange} />
                                    {!isEdit && <p className="text-[10px] font-bold text-gray-500 mt-1 px-1">{formatDate(vehicle.rcDate)}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Summary for Desktop */}
                        <div className="hidden md:grid grid-cols-3 gap-4">
                            <QuickStat icon={<ShieldCheck size={20} />} label="Compliance" value="98%" />
                            <QuickStat icon={<MapPin size={20} />} label="Location" value="Main Hub" />
                            <QuickStat icon={<FileText size={20} />} label="Docs" value="4/4" />
                        </div>
                    </div>
                </div>

                {/* DOCUMENTS SECTION */}
                <div className="pt-8">
                    <div className="flex items-center gap-4 mb-8 px-2">
                        <h3 className="font-black text-gray-800 uppercase tracking-widest text-sm">Regulatory Documents</h3>
                        <div className="flex-1 h-px bg-gray-100"></div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <DocCard isEdit={isEdit} img={vehicle.rcImage} label="RC Document" preview={docPreviews.rcImage} onSelect={file => handleDocSelect("rcImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.insuranceImage} label="Insurance" preview={docPreviews.insuranceImage} onSelect={file => handleDocSelect("insuranceImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.pollutionImage} label="Pollution (PUC)" preview={docPreviews.pollutionImage} onSelect={file => handleDocSelect("pollutionImage", file)} />
                        <DocCard isEdit={isEdit} img={vehicle.speedImage} label="Speed Cert" preview={docPreviews.speedImage} onSelect={file => handleDocSelect("speedImage", file)} />
                    </div>
                </div>

                {/* MOBILE FLOATING ACTION BAR */}
                <div className="fixed bottom-6 left-6 right-6 md:hidden z-10">
                    {isEdit ? (
                        <div className="flex gap-3 bg-gray-900/90 backdrop-blur-2xl p-3 rounded-[2rem] border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10">
                            <button onClick={handleCancel} className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 text-white">
                                <X size={24} />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                                className="flex-1 h-14 flex items-center justify-center gap-2 rounded-full bg-orange-500 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Apply Changes"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEdit(true)}
                            className="w-full h-16 flex items-center justify-center gap-3 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-transform"
                        >
                            <Edit size={20} /> Edit Fleet Asset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const QuickStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center gap-4">
        <div className="text-orange-500">{icon}</div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="font-black text-gray-900">{value}</p>
        </div>
    </div>
);

const DocCard = ({ label, img, preview, onSelect, isEdit }: { label: string; img?: string; preview?: string | null; onSelect: (file: File) => void; isEdit: boolean; }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasImage = preview || img;

    return (
        <div className="flex flex-col gap-4 group">
            <div
                onClick={() => isEdit && inputRef.current?.click()}
                className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden transition-all duration-500 
                    ${isEdit ? 'cursor-pointer ring-2 ring-dashed ring-orange-200 hover:ring-orange-500 bg-orange-50/30' : 'bg-white shadow-xl ring-1 ring-gray-100'}
                    ${!hasImage && !isEdit ? 'bg-gray-50 flex items-center justify-center' : ''}`}
            >
                {hasImage ? (
                    <img
                        src={preview || `${FILE_BASE_URL}${img}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={label}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300 p-4 text-center">
                        <AlertCircle size={32} strokeWidth={1} />
                        <span className="text-[8px] font-black uppercase tracking-widest leading-tight">Document Missing</span>
                    </div>
                )}

                {isEdit && (
                    <div className="absolute inset-0 bg-orange-600/20 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white p-4 rounded-full shadow-2xl text-orange-600">
                            <Camera size={20} />
                        </div>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])} />
            </div>
            <div className="text-center">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block truncate px-2">{label}</span>
            </div>
        </div>
    );
};