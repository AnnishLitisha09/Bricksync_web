import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBunkStore } from "../../../store/useBunkStore";

export default function AddBunkPage() {
  const navigate = useNavigate();
  const { createBunk, loading } = useBunkStore();

  const [form, setForm] = useState({
    bunkName: "",
    ownerName: "",
    phoneNumber: "",
    address: "",
    amount: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.bunkName ||
      !form.ownerName ||
      !form.phoneNumber ||
      !form.address ||
      !form.amount
    ) {
      alert("Please fill all fields");
      return;
    }

    await createBunk({
      ...form,
      amount: Number(form.amount),
    });

    navigate("/shop/bunks");
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="bg-orange-500 px-8 py-5 flex items-center gap-3">
        <span className="text-white text-xl">⛽</span>
        <h1 className="text-white text-xl font-semibold">
          Add Fuel Bunk
        </h1>
      </div>

      {/* BODY */}
      <div className="p-8">
        {/* SECTION TITLE */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Bunk Details
          </h2>
          <hr className="mt-2 border-gray-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Bunk Name"
              name="bunkName"
              placeholder="Enter bunk name"
              value={form.bunkName}
              onChange={handleChange}
            />

            <Input
              label="Owner Name"
              name="ownerName"
              placeholder="Enter owner name"
              value={form.ownerName}
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
              label="Amount (₹)"
              name="amount"
              type="number"
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange}
            />
          </div>

          {/* ADDRESS */}
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Address
  </label>
  <textarea
    name="address"
    value={form.address}
    onChange={handleChange}
    placeholder="Enter bunk address"
    rows={3}
    className="w-full rounded-xl border-2 border-orange-500 px-4 py-2.5 text-sm
    focus:outline-none focus:ring-2 focus:ring-orange-400 transition resize-none"
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
              className="px-8 py-2 rounded-full bg-orange-500 text-white text-sm
              hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Bunk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* 🔹 Input matching reference style */
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

