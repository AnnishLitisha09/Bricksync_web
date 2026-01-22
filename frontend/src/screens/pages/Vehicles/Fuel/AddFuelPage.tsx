import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFuelStore } from "../../../../store/useFuelStore";
import { useVehicleStore } from "../../../../store/useVehicleStore";
import { useBunkStore } from "../../../../store/useBunkStore";

const inputClass =
  "w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

export default function AddFuelPage() {
  const navigate = useNavigate();
  const { createFuel, loading } = useFuelStore();
  const { vehicles, fetchVehicles } = useVehicleStore();
  const { bunks, fetchBunks, loading: bunksLoading } = useBunkStore();

  const [form, setForm] = useState({
    vehicleId: "",
    bunkId: "",
    volume: "",
    amount: "",
    date: "",
    kilometer: "",
  });

  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchBunks();
  }, [fetchVehicles, fetchBunks]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedVehicle = vehicles.find(
      (v) => v.id === Number(form.vehicleId)
    );

    if (
      !form.vehicleId ||
      !form.bunkId ||
      !form.volume ||
      !form.amount ||
      !form.date ||
      !form.kilometer
    ) {
      alert("Please fill all fields");
      return;
    }

    if (
      selectedVehicle &&
      Number(form.kilometer) <= selectedVehicle.kilometer
    ) {
      setErrorMsg(
        `Kilometer must be greater than current reading (${selectedVehicle.kilometer})`
      );
      return;
    }

    await createFuel({
      vehicleId: Number(form.vehicleId),
      bunkId: Number(form.bunkId),
      volume: Number(form.volume),
      amount: Number(form.amount),
      date: form.date,
      kilometer: Number(form.kilometer),
    });

    navigate("/vehicles/fuel");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Add Fuel Record
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-orange-500"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* VEHICLE + BUNK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Vehicle
            </label>
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vehicleNumber} (Current Km: {v.kilometer})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Fuel Bunk
            </label>
            {bunksLoading ? (
              <p className="text-sm text-gray-500 mt-2">
                Loading bunks...
              </p>
            ) : (
              <select
                name="bunkId"
                value={form.bunkId}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Bunk</option>
                {bunks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bunkName} — {b.ownerName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* VOLUME + AMOUNT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Fuel Volume (Litres)
            </label>
            <input
              type="number"
              name="volume"
              value={form.volume}
              onChange={handleChange}
              placeholder="Eg: 50"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Eg: 5000"
              className={inputClass}
            />
          </div>
        </div>

        {/* DATE + KM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Fuel Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Current Kilometer Reading
            </label>
            <input
              type="number"
              name="kilometer"
              value={form.kilometer}
              onChange={handleChange}
              placeholder="Eg: 450"
              className={inputClass}
            />
            {errorMsg && (
              <p className="text-red-500 text-sm mt-1">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Fuel Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
