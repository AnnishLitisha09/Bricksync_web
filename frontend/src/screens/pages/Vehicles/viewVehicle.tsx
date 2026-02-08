/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArrowLeft, Edit, Save, X, Camera, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import Input from "../../../components/InputBox";
import { useVehicleStore, type Vehicle } from "../../../store/useVehicleStore";
import { decryptId } from "../../../utils/functions";
import toast from "react-hot-toast";

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
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header: Adaptive for Mobile/Desktop */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div className="flex-1">
                        {isEdit ? (
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Editing Profile</span>
                                <input 
                                    name="vehicleName" 
                                    className="w-full text-2xl md:text-4xl font-black bg-transparent border-b-2 border-orange-500 focus:outline-none py-1"
                                    value={vehicle.vehicleName} 
                                    onChange={handleChange} 
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                    {vehicle.vehicleName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className="font-mono text-xs md:text-sm font-bold bg-gray-900 text-white px-3 py-1 rounded-full shadow-sm">
                                        {vehicle.vehicleNumber}
                                    </span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm">
                                        <div className={`h-2 w-2 rounded-full ${vehicle.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {vehicle.isActive ? 'In Fleet' : 'Maintenance'}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Action Buttons - Sticky on mobile? Optional: fixed bottom on mobile */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {isEdit ? (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={handleCancel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                                <X size={18} /> <span className="hidden sm:inline">Cancel</span>
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={!hasChanges || saving}
                                className="flex-2 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200 disabled:opacity-50 transition-all"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save</>}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setEdit(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95">
                            <Edit size={18} /> Edit Vehicle Details
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                
                {/* Vehicle Hero Image */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="group relative aspect-[4/3] sm:aspect-video lg:aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white ring-1 ring-gray-100">
                        <img
                            src={docPreviews.vehicleImage || (vehicle.vehicleImage ? `${FILE_BASE_URL}${vehicle.vehicleImage}` : "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800")}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            alt="Vehicle"
                        />
                        {isEdit && (
                            <div 
                                onClick={() => vehicleImageRef.current?.click()}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300"
                            >
                                <div className="bg-white/20 p-4 rounded-full mb-3 backdrop-blur-md">
                                    <Camera size={32} />
                                </div>
                                <span className="font-black uppercase tracking-widest text-[10px]">Change Vehicle Photo</span>
                            </div>
                        )}
                    </div>
                    <input ref={vehicleImageRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleDocSelect("vehicleImage", e.target.files[0])} />
                </div>

                {/* Technical Specs Card */}
                <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-500 shadow-inner">
                            <FileText size={24}/>
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">Technical Specs</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Mechanical & Registration</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Input label="License Plate" name="vehicleNumber" disabled={!isEdit} value={vehicle.vehicleNumber} onChange={handleChange} />
                        <Input label="Odometer (KM)" name="kilometer" type="number" disabled={!isEdit} value={String(vehicle.kilometer ?? "")} onChange={handleChange} />
                        <Input label="Insurance Expiry" name="insurance" type="date" disabled={!isEdit} value={vehicle.insurance?.slice(0, 10) ?? ""} onChange={handleChange} />
                        <Input label="Pollution (PUC) Valid Till" name="pollution" type="date" disabled={!isEdit} value={vehicle.pollution?.slice(0, 10) ?? ""} onChange={handleChange} />
                        <div className="sm:col-span-2">
                            <Input label="Registration (RC) Issue Date" name="rcDate" type="date" disabled={!isEdit} value={vehicle.rcDate?.slice(0, 10) ?? ""} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-900 rounded-xl text-white shadow-lg">
                            <CheckCircle2 size={20}/>
                        </div>
                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Compliance Documents</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <DocCard isEdit={isEdit} img={vehicle.rcImage} label="Registration Certificate" preview={docPreviews.rcImage} onSelect={file => handleDocSelect("rcImage", file)} />
                    <DocCard isEdit={isEdit} img={vehicle.insuranceImage} label="Insurance Policy" preview={docPreviews.insuranceImage} onSelect={file => handleDocSelect("insuranceImage", file)} />
                    <DocCard isEdit={isEdit} img={vehicle.pollutionImage} label="Pollution Certificate" preview={docPreviews.pollutionImage} onSelect={file => handleDocSelect("pollutionImage", file)} />
                    <DocCard isEdit={isEdit} img={vehicle.speedImage} label="Speed Limit Cert" preview={docPreviews.speedImage} onSelect={file => handleDocSelect("speedImage", file)} />
                </div>
            </div>
        </div>
    );
}

const DocCard = ({ label, img, preview, onSelect, isEdit }: { label: string; img?: string; preview?: string | null; onSelect: (file: File) => void; isEdit: boolean; }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasImage = preview || img;

    return (
        <div className="flex flex-col gap-3 group">
            <div 
                onClick={() => isEdit && inputRef.current?.click()} 
                className={`relative aspect-[3/4] sm:aspect-square md:aspect-[3/4] rounded-[2rem] overflow-hidden border-2 transition-all duration-500 
                    ${isEdit ? 'cursor-pointer border-dashed border-orange-200 hover:border-orange-500 bg-orange-50/50' : 'border-white shadow-lg bg-white ring-1 ring-gray-100'}
                    ${!hasImage && !isEdit ? 'bg-gray-50 flex items-center justify-center' : ''}`}
            >
                {hasImage ? (
                    <img
                        src={preview || `${FILE_BASE_URL}${img}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={label}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                        <AlertCircle size={32} strokeWidth={1} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">No Document</span>
                    </div>
                )}

                {isEdit && (
                    <div className="absolute inset-0 bg-orange-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white p-4 rounded-full shadow-2xl text-orange-600 transform scale-75 group-hover:scale-100 transition-transform">
                            <Camera size={24} />
                        </div>
                    </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])} />
            </div>
            <div className="px-2">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{label}</span>
            </div>
        </div>
    );
};