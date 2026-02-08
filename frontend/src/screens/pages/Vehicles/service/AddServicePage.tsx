import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVehicleStore } from "../../../../store/useVehicleStore";
import { useServiceShopStore } from "../../../../store/useServiceShopStore";
import { BASE_URL, getAuthHeader } from "../../../../api/base";

const inputClass =
  "w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

export default function AddServicePage() {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { shops, fetchShops, loading: shopsLoading } = useServiceShopStore();

  const [form, setForm] = useState({
    vehicleId: "",
    serviceShopId: "", // keep as string for select value
    topic: "",
    description: "",
    date: "",
    amount: "",
    kilometer: "",
  });

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchShops();
  }, [fetchVehicles, fetchShops]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required fields validation
    if (!form.vehicleId || !form.topic || !form.date || !form.amount || !form.kilometer) {
      alert("Please fill all required fields");
      return;
    }

    const vehicleIdNum = Number(form.vehicleId);
    const serviceShopIdNum = form.serviceShopId ? Number(form.serviceShopId) : null;
    const amountNum = Number(form.amount);
    const kilometerNum = Number(form.kilometer);

    // Validate number conversions
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Amount must be a valid positive number");
      return;
    }
    if (isNaN(kilometerNum) || kilometerNum <= 0) {
      setErrorMsg("Kilometer must be a valid positive number");
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === vehicleIdNum);
    if (selectedVehicle && kilometerNum <= selectedVehicle.kilometer) {
      setErrorMsg(`Kilometer must be greater than current reading (${selectedVehicle.kilometer})`);
      return;
    }

    // Generate a random serviceId
    const serviceId = Math.floor(Math.random() * 1000000);

    const payload = {
      vehicleId: vehicleIdNum,
      serviceId,
      serviceShopId: serviceShopIdNum,
      topic: form.topic,
      description: form.description || "",
      date: form.date,
      amount: amountNum,
      kilometer: kilometerNum,
    };

    console.log("Submitting Service Data:", payload);

    try {
      const res = await fetch(`${BASE_URL}/vehicle-services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Response:", data);

      if (!res.ok) {
        alert(data.message || "Failed to add service");
        return;
      }

      navigate("/vehicles/services");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Add Vehicle Service</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-orange-500"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* VEHICLE + SHOP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Vehicle</label>
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} ({v.vehicleName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Service Shop (Optional)</label>
            {shopsLoading ? (
              <p className="text-sm text-gray-500 mt-2">Loading shops...</p>
            ) : (
              <select
                name="serviceShopId"
                value={form.serviceShopId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Shop</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shop_name} — {s.owner}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TOPIC + DESCRIPTION */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Service Topic</label>
            <input
              type="text"
              name="topic"
              value={form.topic}
              onChange={handleChange}
              placeholder="Eg: Engine Oil Change"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Details about the service"
              className={inputClass}
            />
          </div>
        </div>

        {/* DATE + AMOUNT + KM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Service Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Amount (₹)</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Eg: 2500"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Kilometer Reading</label>
            <input
              type="number"
              name="kilometer"
              value={form.kilometer}
              onChange={handleChange}
              placeholder="Eg: 45000"
              className={inputClass}
            />
            {errorMsg && <p className="text-red-500 text-sm mt-1">{errorMsg}</p>}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>

          <button type="submit" className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
            Save Service Record
          </button>
        </div>
      </form>
    </div>
  );
}
