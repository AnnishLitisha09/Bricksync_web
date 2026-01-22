import { useEffect, useRef, useState } from "react";
import { useUserStore } from "../../../store/useUserStore";
import {
  getProfile,
  updateProfileImage,
  updateAadhaarImage,
  updateDrivingLicenceImage,
  updateDrivingLicenceBack,
} from "../../../api/user";
import { FILE_BASE_URL } from "../../../api/base";

/* 🔹 Profile Page */
export default function ProfilePage() {
  const { user, setUser } = useUserStore();

  // Refs for file inputs
  const profileRef = useRef<HTMLInputElement | null>(null);
  const aadhaarRef = useRef<HTMLInputElement | null>(null);
  const licenceRef = useRef<HTMLInputElement | null>(null);
  const licenceBackRef = useRef<HTMLInputElement | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [validityDate, setValidityDate] = useState<string>("");
  const [editedFields, setEditedFields] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  /* 🔹 Fetch profile */
  useEffect(() => {
    const loadProfile = async () => {
      const data = await getProfile();
      setUser(data);
      setEditedFields({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
      if (data.drivingLicenceValidity)
        setValidityDate(data.drivingLicenceValidity.split("T")[0]);
    };
    loadProfile();
  }, [setUser]);

  /* 🔹 Refresh profile */
  const refreshProfile = async () => {
    const updated = await getProfile();
    setUser(updated);
    setEditedFields({
      name: updated.name,
      email: updated.email,
      phoneNumber: updated.phoneNumber,
    });
    if (updated.drivingLicenceValidity)
      setValidityDate(updated.drivingLicenceValidity.split("T")[0]);
  };

  /* 🔹 Upload handlers */
  const handleFileUpload = async (
    file: File | undefined,
    uploadFn: (file: File) => Promise<void>
  ) => {
    if (!file) return;
    setLoading(true);
    try {
      await uploadFn(file);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  const handleLicenceBackUpload = async (file: File | undefined) => {
    if (!file || !validityDate) return alert("Please select validity date first.");
    setLoading(true);
    try {
      await updateDrivingLicenceBack(file, validityDate);
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 Update editable fields (name, email, phone) */
  const handleSaveField = async (field: "name" | "email" | "phoneNumber") => {
    if (!user) return;
    const value = editedFields[field];
    if (value === user[field]) return; // no change
    try {
      const formData = new FormData();
      formData.append(field, value);

      const res = await fetch(`http://localhost:3000/api/user/profile/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Failed to update ${field}`);

      await refreshProfile();
      alert(`${field} updated successfully`);
    } catch (err) {
      console.error(err);
      alert(`Error updating ${field}`);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">

        {/* LEFT */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-gray-700">Account Management</h2>

          {/* Profile Image */}
          <div className="bg-rose-100 rounded-xl p-4">
            <img
              src={user?.imageUrl ? `${FILE_BASE_URL}${user.imageUrl}` : "https://via.placeholder.com/300"}
              className="rounded-lg object-cover h-60 w-full"
              alt="Profile"
            />
          </div>

          <input
            ref={profileRef}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files?.[0], updateProfileImage)}
          />

          <button
            onClick={() => profileRef.current?.click()}
            disabled={loading}
            className="w-full border rounded-lg py-2 text-sm font-medium"
          >
            Upload Profile Photo
          </button>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-10">

          {/* Profile Information */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="User ID" value={String(user?.userid)} />
              <Input label="Role" value={user?.userRole === 1 ? "Admin" : "User"} />
              <Input
                label="Wallet Amount"
                value={String(user?.amount)}
              />

              {/* Editable fields */}
              {["name", "email", "phoneNumber"].map((field) => (
                <div key={field} className="relative">
                  <label className="text-sm text-gray-600">{field === "phoneNumber" ? "Phone Number" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    value={editedFields[field as keyof typeof editedFields]}
                    onChange={(e) =>
                      setEditedFields((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                  {editedFields[field as keyof typeof editedFields] !== user?.[field as keyof typeof editedFields] && (
                    <button
                      onClick={() => handleSaveField(field as any)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded text-xs"
                    >
                      Save
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proofs */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Proof</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Aadhaar */}
              <UploadCard
                title="Aadhaar Card"
                imgUrl={user?.aadharUrl}
                refInput={aadhaarRef}
                onUpload={(e) => handleFileUpload(e.target.files?.[0], updateAadhaarImage)}
              />

              {/* Driving Licence Front */}
              <UploadCard
                title="Driving Licence Front"
                imgUrl={user?.drivingLicenceUrl}
                refInput={licenceRef}
                onUpload={(e) => handleFileUpload(e.target.files?.[0], updateDrivingLicenceImage)}
              />

              {/* Driving Licence Back */}
              <UploadCard
                title="Driving Licence Back"
                imgUrl={user?.drivingLicenceBackUrl}
                refInput={licenceBackRef}
                onUpload={(e) => handleLicenceBackUpload(e.target.files?.[0])}
                date={validityDate}
                setDate={setValidityDate}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* 🔹 Reusable Input */
function Input({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        value={value || ""}
        readOnly
        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
      />
    </div>
  );
}

/* 🔹 Reusable Upload Card */
interface UploadCardProps {
  title: string;
  imgUrl?: string | null;
  refInput: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  date?: string;
  setDate?: (value: string) => void;
}

function UploadCard({ title, imgUrl, refInput, onUpload, date, setDate }: UploadCardProps) {
  return (
    <div className="bg-gray-100 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <img
        src={imgUrl ? `${FILE_BASE_URL}${imgUrl}` : "https://via.placeholder.com/300"}
        className="rounded-lg object-cover h-56 w-full"
        alt={title}
      />
      <input ref={refInput} type="file" hidden accept="image/*" onChange={onUpload} />

      {date !== undefined && setDate && (
        <input
          type="date"
          className="mt-2 w-full border rounded-lg px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      )}

      <button
        onClick={() => refInput.current?.click()}
        className="w-full border rounded-lg py-2 text-sm"
      >
        Upload {title}
      </button>
    </div>
  );
}
