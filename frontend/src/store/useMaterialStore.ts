import { create } from "zustand";
import { BASE_URL} from "../api/base";
import { isStale } from "./storeUtils";

export interface Supplier {
    id: number;
    shop_name: string;
    owner_name: string;
    phone_no: string;
    address: string;
    category: string;
    balance: string | number;
    createdAt: string;
}

interface MaterialStore {
    suppliers: Supplier[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    fetchSuppliers: (force?: boolean) => Promise<void>;
    deleteSupplier: (id: number) => Promise<void>;
    invalidate: () => void;
}

const TTL = 120_000; // 2 minutes

export const useMaterialStore = create<MaterialStore>((set, get) => ({
    suppliers: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchSuppliers: async (force = false) => {
        if (!force && !isStale(get().lastFetched, TTL)) return;
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${BASE_URL}/materials/suppliers`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const result = await res.json();
            if (result.success) {
                set({ suppliers: result.data, loading: false, lastFetched: Date.now() });
            } else {
                throw new Error(result.message || "Failed to fetch suppliers");
            }
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    deleteSupplier: async (id) => {
        const res = await fetch(`${BASE_URL}/materials/suppliers/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || "Failed to delete");
        set((state) => ({
            suppliers: state.suppliers.filter((s) => s.id !== id),
            lastFetched: null,
        }));
        await get().fetchSuppliers(true);
    },

    invalidate: () => set({ lastFetched: null }),
}));
