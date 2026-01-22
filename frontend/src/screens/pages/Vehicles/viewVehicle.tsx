/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArrowLeft, Check, Edit } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FILE_BASE_URL } from "../../../api/base";
import Input from "../../../components/InputBox";
import { useVehicleStore, type Vehicle } from "../../../store/useVehicleStore";
import { decryptId } from "../../../utils/functions";

type DocKey = "vehicleImage" | "rcImage" | "insuranceImage" | "pollutionImage" | "speedImage";

export default function ViewVehicle() {
    const { hashId } = useParams();
    const navigate = useNavigate();
    const { fetchVehicleById, fetchVehicles, updateVehicle } = useVehicleStore();

    const [vehicle, setVehicle] = useState<Vehicle>({} as Vehicle);
    const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);

    const vehicleImageRef = useRef<HTMLInputElement>(null);

    const [docFiles, setDocFiles] = useState<Record<DocKey, File | null>>({
        vehicleImage: null,
        rcImage: null,
        insuranceImage: null,
        pollutionImage: null,
        speedImage: null,
    });

    const [docPreviews, setDocPreviews] = useState<Record<DocKey, string | null>>({
        vehicleImage: null,
        rcImage: null,
        insuranceImage: null,
        pollutionImage: null,
        speedImage: null,
    });

    const [loading, setLoading] = useState(true);
    const [isEdit, setEdit] = useState(false);

    useEffect(() => {
        const loadVehicle = async () => {
            try {
                const id = decryptId(hashId!);
                if (!id) {
                    await fetchVehicles();
                    navigate("/vehicles");
                    return;
                }

                const data = await fetchVehicleById(id); // must return vehicle
                setVehicle(data);
                setOriginalVehicle(data);
            } catch (error) {
                console.error(error);
                await fetchVehicles();
                navigate("/vehicles");
            } finally {
                setLoading(false);
            }
        };

        loadVehicle();
    }, [hashId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setVehicle(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCancel = () => {
        if (originalVehicle) setVehicle(originalVehicle);

        setDocFiles({
            vehicleImage: null,
            rcImage: null,
            insuranceImage: null,
            pollutionImage: null,
            speedImage: null,
        });

        setDocPreviews({
            vehicleImage: null,
            rcImage: null,
            insuranceImage: null,
            pollutionImage: null,
            speedImage: null,
        });

        setEdit(false);
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();

            formData.append("vehicleName", vehicle.vehicleName);
            formData.append("vehicleNumber", vehicle.vehicleNumber);
            formData.append("kilometer", String(vehicle.kilometer));
            formData.append("insurance", vehicle.insurance ?? "");
            formData.append("pollution", vehicle.pollution ?? "");
            formData.append("rcDate", vehicle.rcDate ?? "");
            formData.append("isActive", String(vehicle.isActive));

            (Object.keys(docFiles) as DocKey[]).forEach(key => {
                if (docFiles[key]) {
                    formData.append(key, docFiles[key]!);
                }
            });

            await updateVehicle(vehicle.id, formData);
            setEdit(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDocSelect = (key: DocKey, file: File) => {
        setDocFiles(prev => ({ ...prev, [key]: file }));
        setDocPreviews(prev => ({
            ...prev,
            [key]: URL.createObjectURL(file),
        }));
    };

    const hasChanges = (() => {
        if (!originalVehicle) return false;

        const fieldsChanged =
            vehicle.vehicleName !== originalVehicle.vehicleName ||
            vehicle.vehicleNumber !== originalVehicle.vehicleNumber ||
            vehicle.kilometer !== originalVehicle.kilometer ||
            vehicle.insurance !== originalVehicle.insurance ||
            vehicle.pollution !== originalVehicle.pollution ||
            vehicle.rcDate !== originalVehicle.rcDate ||
            vehicle.isActive !== originalVehicle.isActive;

        const fileChanged = Object.values(docFiles).some(file => file !== null);

        return fieldsChanged || fileChanged;
    })();

    // ✅ Use loading state so TS6133 error disappears
    if (loading) return <p className="p-6">Loading vehicle...</p>;
    if (!vehicle || !vehicle.id)
        return <p className="p-6 text-red-500">Vehicle not found</p>;

    return (
        <div className="mx-auto p-5 px-6 space-y-3 rounded-2xl bg-white">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                >
                    <ArrowLeft />
                </button>
                {isEdit ? (
                    <Input name="vehicleName" value={vehicle.vehicleName} onChange={handleChange} />
                ) : (
                    <h1 className="text-3xl font-bold">{vehicle.vehicleName}</h1>
                )}
                <button
                    onClick={() => {
                        if (!isEdit) setOriginalVehicle(vehicle);
                        setEdit(prev => !prev);
                    }}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                    {isEdit ? <Check /> : <Edit />}
                </button>
            </div>

            {/* Main Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50 p-6 rounded-2xl shadow-md">
                {/* Image */}
                <div
                    className="md:col-span-4 cursor-pointer"
                    onClick={() => vehicleImageRef.current?.click()}
                >
                    <img
                        src={
                            docPreviews.vehicleImage
                                ? docPreviews.vehicleImage
                                : vehicle.vehicleImage
                                    ? `${FILE_BASE_URL}${vehicle.vehicleImage}`
                                    : "https://via.placeholder.com/500x300"
                        }
                        className="rounded-xl shadow-md w-full h-[calc(35vh-50px)] object-cover"
                        alt="Vehicle"
                    />

                    <input
                        ref={vehicleImageRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => {
                            if (e.target.files?.[0]) handleDocSelect("vehicleImage", e.target.files[0]);
                        }}
                    />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:col-span-8 gap-4 gap-y-0">
                    <Input label="Vehicle Number" name="vehicleNumber" value={vehicle.vehicleNumber} onChange={handleChange} />
                    <Input label="Kilometer" name="kilometer" type="number" value={String(vehicle.kilometer ?? "")} onChange={handleChange} />
                    <Input label="Insurance" name="insurance" type="date" value={vehicle.insurance?.slice(0, 10) ?? ""} onChange={handleChange} />
                    <Input label="Pollution" name="pollution" type="date" value={vehicle.pollution?.slice(0, 10) ?? ""} onChange={handleChange} />
                    <Input label="RC Date" name="rcDate" type="date" value={vehicle.rcDate?.slice(0, 10) ?? ""} onChange={handleChange} />
                </div>
            </div>

            {/* Documents */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Doc img={vehicle.rcImage} label="RC" preview={docPreviews.rcImage} onSelect={file => handleDocSelect("rcImage", file)} />
                <Doc img={vehicle.insuranceImage} label="Insurance" preview={docPreviews.insuranceImage} onSelect={file => handleDocSelect("insuranceImage", file)} />
                <Doc img={vehicle.pollutionImage} label="Pollution" preview={docPreviews.pollutionImage} onSelect={file => handleDocSelect("pollutionImage", file)} />
                <Doc img={vehicle.speedImage} label="Speed" preview={docPreviews.speedImage} onSelect={file => handleDocSelect("speedImage", file)} />
            </div>

            <div className="w-full flex justify-end gap-4 mt-5">
                <button
                    onClick={handleCancel}
                    className="border-2 border-gray-400 text-gray-500 px-6 py-1 rounded-lg hover:bg-orange-100 font-semibold flex gap-2 cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`border-2 px-8 py-1 rounded-lg font-semibold flex gap-2 ${
                        hasChanges
                            ? "border-orange-500 text-orange-500 hover:bg-orange-100"
                            : "border-orange-200 text-orange-200 cursor-not-allowed"
                    }`}
                >
                    Save
                </button>
            </div>
        </div>
    );
}

/* Reusable UI */

const Doc = ({
    label,
    img,
    preview,
    onSelect,
}: {
    label: string;
    img?: string;
    preview?: string | null;
    onSelect: (file: File) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="bg-gray-50 rounded-xl shadow-md py-3">
            <p className="text-md text-orange-600 font-medium px-5">{label}</p>

            <div onClick={() => inputRef.current?.click()} className="cursor-pointer hover:bg-orange-50">
                <img
                    src={preview ? preview : img ? `${FILE_BASE_URL}${img}` : "https://via.placeholder.com/150"}
                    className="h-36 mx-auto mt-2 object-cover rounded-lg"
                />

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => {
                        if (e.target.files?.[0]) onSelect(e.target.files[0]);
                    }}
                />
            </div>
        </div>
    );
};
