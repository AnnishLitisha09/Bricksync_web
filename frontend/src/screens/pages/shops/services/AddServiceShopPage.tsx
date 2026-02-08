import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";

export default function AddServiceShopPage() {
  const navigate = useNavigate();
  const { createServiceShop, loading } = useServiceShopStore();

  const [form, setForm] = useState({
    shop_name: "",
    owner: "",
    phone: "",
    address: "",
    amount: "",
    type: "showroom",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.shop_name ||
      !form.owner ||
      !form.phone ||
      !form.address ||
      !form.amount ||
      !form.type
    ) {
      alert("Please fill all fields");
      return;
    }

    await createServiceShop({
      shop_name: form.shop_name,
      owner: form.owner,
      phone: form.phone,
      address: form.address,
      amount: Number(form.amount),
      type: form.type as any,
    });

    navigate("/shop/services");
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
      {/* HEADER */}
      <div className="bg-orange-500 px-8 py-5 flex items-center gap-3">
        <span className="text-white text-xl">🛠️</span>
        <h1 className="text-white text-xl font-semibold">
          Add Service Shop
        </h1>
      </div>

      {/* BODY */}
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Service Shop Details
          </h2>
          <hr className="mt-2 border-gray-300" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Shop Name"
              name="shop_name"
              placeholder="Enter shop name"
              value={form.shop_name}
              onChange={handleChange}
            />

            <Input
              label="Owner Name"
              name="owner"
              placeholder="Enter owner name"
              value={form.owner}
              onChange={handleChange}
            />

            <Input
              label="Phone Number"
              name="phone"
              placeholder="Enter phone number"
              value={form.phone}
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

            {/* TYPE DROPDOWN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-orange-500 px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              >
                <option value="showroom">Showroom</option>
                <option value="paint">Paint</option>
                <option value="tyre">Tyre</option>
                <option value="others">Others</option>
              </select>
            </div>
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
              placeholder="Enter service shop address"
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
              {loading ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* 🔹 Input – SAME style as AddBunkPage */
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
