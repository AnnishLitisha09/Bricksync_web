import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL, getAuthHeader } from "../../../api/base";

export default function AddDriverPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    amount: "",
    drivingLicenceValidity: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [aadhar, setAadhar] = useState<File | null>(null);
  const [drivingLicence, setDrivingLicence] = useState<File | null>(null);
  const [drivingLicenceBack, setDrivingLicenceBack] = useState<File | null>(
    null
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.phoneNumber ||
      !form.password ||
      !form.amount ||
      !form.drivingLicenceValidity ||
      !image ||
      !aadhar ||
      !drivingLicence
    ) {
      alert("Please fill all fields and upload required files");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phoneNumber", form.phoneNumber);
    formData.append("password", form.password);
    formData.append("amount", form.amount);
    formData.append("drivingLicenceValidity", form.drivingLicenceValidity);

    formData.append("image", image);
    formData.append("aadhar", aadhar);
    formData.append("drivingLicence", drivingLicence);
    if (drivingLicenceBack) {
      formData.append("drivingLicenceBack", drivingLicenceBack);
    }

    try {
      const res = await fetch(`${BASE_URL}/driver/create-driver`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      });

      const data = await res.json();
      console.log(data);

      navigate("/staff"); // Back to driver list
    } catch (error) {
      console.log("Error creating driver", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="bg-orange-500 px-8 py-5 flex items-center gap-3">
        <span className="text-white text-xl">🚚</span>
        <h1 className="text-white text-xl font-semibold">Add Driver</h1>
      </div>

      {/* BODY */}
      <div className="p-8">
        {/* SECTION TITLE */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Driver Details
          </h2>
          <hr className="mt-2 border-gray-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Driver Name"
              name="name"
              placeholder="Enter driver name"
              value={form.name}
              onChange={handleChange}
            />

            <Input
              label="Email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
            />

            <Input
              label="Phone Number"
              name="phoneNumber"
              placeholder="Enter phone number"
              value={form.phoneNumber}
              onChange={handleChange}
            />

            <Input
              label="Password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
            />

            <Input
              label="Amount"
              name="amount"
              type="number"
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange}
            />

            <Input
              label="Driving Licence Validity"
              name="drivingLicenceValidity"
              type="date"
              value={form.drivingLicenceValidity}
              onChange={handleChange}
            />
          </div>

          {/* FILE UPLOAD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileInput label="Profile Image" onChange={setImage} />
            <FileInput label="Aadhar" onChange={setAadhar} />
            <FileInput label="Driving Licence" onChange={setDrivingLicence} />
            <FileInput
              label="Driving Licence Back"
              onChange={setDrivingLicenceBack}
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-full border border-gray-400 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 rounded-full bg-orange-500 text-white text-sm hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Input = ({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-xl border-2 border-orange-500 px-4 py-2.5 text-sm
      focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    />
  </div>
);

const FileInput = ({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="file"
      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
      className="w-full rounded-xl border-2 border-orange-500 px-4 py-2.5 text-sm
      focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    />
  </div>
);
