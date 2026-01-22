import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore } from "../../../store/useVehicleStore";
import toast from "react-hot-toast";
import { Car, UploadCloud } from "lucide-react";
import Input from "../../../components/InputBox";

export default function AddVehicle() {
  const navigate = useNavigate();
  const { addVehicle } = useVehicleStore();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    vehicleName: "",
    vehicleNumber: "",
    insurance: "",
    pollution: "",
    rcDate: "",
    kilometer: "",
    vehicleImage: null as File | null,
    rcImage: null as File | null,
    insuranceImage: null as File | null,
    pollutionImage: null as File | null,
    speedImage: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setForm({ ...form, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.append(key, value as any);
      }
    });

    try {
      await addVehicle(data); // ✅ success
      toast.success("🚗 Vehicle added successfully!");
      navigate("/vehicles");
    } catch (error) {
      console.error(error);
      toast.error("❌ Failed to add vehicle. Please try again!");
    } finally {
      setLoading(false);
    }
  };


  const FileInput = ({
    name,
    label,
  }: {
    name: keyof typeof form;
    label: string;
  }) => (
    <div className="group relative bg-white p-4 rounded-xl border border-dashed border-orange-300 hover:border-orange-500 transition">
      <label className="text-sm font-medium mb-2 block">{label}</label>

      <input
        id={name}
        type="file"
        name={name}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <label
        htmlFor={name}
        className="flex items-center justify-center gap-2 cursor-pointer text-orange-600 bg-orange-50 py-2 px-4 rounded-lg hover:bg-orange-100"
      >
        <UploadCloud size={18} />
        Upload File
      </label>

      <p className="text-xs text-gray-500 mt-1 truncate text-center">
        {(form[name] as File | null)?.name || "No file selected"}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-orange-50 via-white to-orange-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 p-6 flex items-center gap-3">
          <Car className="text-white" size={28} />
          <h1 className="text-2xl font-bold text-white">
            Register New Vehicle
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Section Title */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Vehicle Details
            </h2>
          </div>

          <Input label="Vehicle Name" name="vehicleName" value={form.vehicleName} onChange={handleChange} />
          <Input label="Vehicle Number" name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} />
          <Input label="Insurance Date" name="insurance" type="date" value={form.insurance} onChange={handleChange} />
          <Input label="Pollution Date" name="pollution" type="date" value={form.pollution} onChange={handleChange} />
          <Input label="RC Date" name="rcDate" type="date" value={form.rcDate} onChange={handleChange} />
          <Input label="Kilometer" name="kilometer" type="number" value={form.kilometer} onChange={handleChange} />

          {/* Upload Section */}
          <div className="md:col-span-2 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              Upload Documents
            </h2>
          </div>

          <FileInput name="vehicleImage" label="Vehicle Image" />
          <FileInput name="rcImage" label="RC Image" />
          <FileInput name="insuranceImage" label="Insurance Image" />
          <FileInput name="pollutionImage" label="Pollution Image" />
          <FileInput name="speedImage" label="Speed Image" />

          <div className="md:col-span-2 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl text-lg font-bold hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Saving Vehicle..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

