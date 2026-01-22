import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Plus } from "lucide-react";
import { useBunkStore } from "../../../store/useBunkStore";

type AmountFilter = "ALL" | "10000" | "20000" | "50000";

export default function BunkPage() {
    const navigate = useNavigate();
    const { bunks, loading, error, fetchBunks } = useBunkStore();

    const [searchTerm, setSearchTerm] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [amountFilter, setAmountFilter] = useState<AmountFilter>("ALL");

    const BRAND_LOGOS: Record<string, string> = {
        "indian oil":
            "https://imgs.search.brave.com/QKKn9Koz5LYVuMXN3Vi3HhIwcj4TQ5sWLTZrpPtCn7E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90NC5m/dGNkbi5uZXQvanBn/LzA0LzEzLzg0LzAz/LzM2MF9GXzQxMzg0/MDMzMV9YZERvSVNq/NWc3Ynd5SjIwbVZn/b3J6SnJITWhIV2FH/dC5qcGc",
        hp: "https://imgs.search.brave.com/-ZWgtd1Au1jei758ijzDsXUjfQL9c50arsoV5yztwow/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jb250/ZW50LmpkbWFnaWNi/b3guY29tL3YyL2Nv/bXAvaHlkZXJhYmFk/L2o1LzA0MHB4eDQw/Lnh4NDAuMTgwNDEw/MjAwMDE1LnM4ajUv/Y2F0YWxvZ3VlL2hw/LXBldHJvbC1idW5r/LWF1dG8tbmFnYXIt/aHlkZXJhYmFkLXBl/dHJvbC1wdW1wcy1w/ZTFDOFJTakdYLmpw/Zz93PTM4NDAmcT03/NQ",
    };

    useEffect(() => {
        fetchBunks();
    }, [fetchBunks]);

    const getBrandLogo = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("indian oil")) return BRAND_LOGOS["indian oil"];
        if (lower.includes("hp")) return BRAND_LOGOS["hp"];
        return null;
    };

    const filteredBunks = bunks.filter((b) => {
        const matchSearch =
            b.bunkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.ownerName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchAmount = true;
        if (amountFilter === "10000") matchAmount = b.amount >= 10000;
        if (amountFilter === "20000") matchAmount = b.amount >= 20000;
        if (amountFilter === "50000") matchAmount = b.amount >= 50000;

        return matchSearch && matchAmount;
    });

    if (loading) {
        return <p className="p-6">Loading bunks...</p>;
    }

    if (error) {
        return <p className="p-6 text-red-500">{error}</p>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Fuel Bunks</h1>

                <button
                    onClick={() => navigate("/shop/bunks/add")}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                    <Plus size={18} />
                    Add Bunk
                </button>
            </div>

            {/* SEARCH + FILTER */}
            <div className="flex gap-3 items-center relative">
                <input
                    type="text"
                    placeholder="Search bunk name or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 rounded-lg px-4 py-2 border focus:ring-2 focus:ring-orange-500"
                />

                <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="p-2 rounded-lg border hover:bg-gray-100"
                >
                    <Filter size={18} />
                </button>

                {showFilter && (
                    <div className="absolute right-0 top-12 bg-white border shadow-xl rounded-xl w-52 z-10">
                        <p className="px-4 py-2 text-sm font-semibold border-b">
                            Filter by Amount
                        </p>

                        {[
                            { label: "All", value: "ALL" },
                            { label: "Above ₹10,000", value: "10000" },
                            { label: "Above ₹20,000", value: "20000" },
                            { label: "Above ₹50,000", value: "50000" },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => {
                                    setAmountFilter(f.value as AmountFilter);
                                    setShowFilter(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 ${amountFilter === f.value
                                    ? "bg-orange-100 text-orange-600 font-semibold"
                                    : ""
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* LIST */}
            <div className="space-y-4">
                {filteredBunks.map((b) => {
                    const logo = getBrandLogo(b.bunkName);

                    return (
                        <div
                            key={b.id}
                            className="flex flex-col md:flex-row gap-5 bg-gray-50 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                        >
                            <div className="w-full md:w-40 h-32 flex items-center justify-center bg-white rounded-xl border">
                                {logo ? (
                                    <img
                                        src={logo}
                                        alt={b.bunkName}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-3xl">⛽</span>
                                )}
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {b.bunkName}
                                    </h2>

                                    <span className="px-4 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                                        ₹ {b.amount?.toLocaleString() || 0}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm">
                                    Owner: <span className="font-medium">{b.ownerName}</span>
                                </p>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 mt-3">
                                    <Info label="Phone" value={b.phoneNumber || "N/A"} />
                                    <Info label="Address" value={b.address || "N/A"} />
                                    <Info
                                        label="Amount"
                                        value={`₹ ${b.amount?.toLocaleString() || 0}`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredBunks.length === 0 && (
                    <p className="text-center text-gray-500 py-10">
                        No fuel bunks found
                    </p>
                )}
            </div>
        </div>
    );
}


const Info = ({ label, value }: { label: string; value: string }) => (
    <div>
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="font-medium">{value}</p>
    </div>
);