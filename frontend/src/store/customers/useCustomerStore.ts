import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../api/base";
import { isStale } from "../storeUtils";

export interface CustomerData {
    id?: number;
    name: string;
    email: string;
    phone_no: string;
    address: string;
    balance: number;
    category: "engineer" | "shop" | "other";
    is_deleted?: boolean;
}

interface CustomerStore {
    customers: CustomerData[];
    totalCustomers: number;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    lastSearch: string;
    lastPage: number;

    /** Fetches customers, respects TTL cache. Pass force=true to skip cache. */
    fetchCustomers: (search?: string, page?: number, force?: boolean) => Promise<void>;
    createCustomer: (data: Omit<CustomerData, "id">) => Promise<void>;
    updateCustomer: (id: number, data: Partial<CustomerData>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    invalidate: () => void;
}

const TTL = 60_000; // 1 min – customer list changes often

export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customers: [],
    totalCustomers: 0,
    loading: false,
    error: null,
    lastFetched: null,
    lastSearch: "",
    lastPage: 1,

    fetchCustomers: async (search = "", page = 1, force = false) => {
        const { lastFetched, lastSearch, lastPage } = get();
        const sameQuery = search === lastSearch && page === lastPage;
        if (!force && sameQuery && !isStale(lastFetched, TTL)) return;

        set({ loading: true, error: null });
        try {
            const res = await fetch(
                `${BASE_URL}/customers?search=${encodeURIComponent(search)}&page=${page}&limit=6`,
                { headers: { ...getAuthHeader() } }
            );
            if (!res.ok) throw new Error("Failed to fetch customers");
            const data = await res.json();
            set({
                customers: data.data || [],
                totalCustomers: data.pagination?.total || 0,
                loading: false,
                lastFetched: Date.now(),
                lastSearch: search,
                lastPage: page,
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    createCustomer: async (data) => {
        const res = await fetch(`${BASE_URL}/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create customer");
        get().invalidate();
        await get().fetchCustomers(get().lastSearch, 1, true);
    },

    updateCustomer: async (id, data) => {
        const res = await fetch(`${BASE_URL}/customers/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update customer");
        get().invalidate();
        await get().fetchCustomers(get().lastSearch, get().lastPage, true);
    },

    deleteCustomer: async (id) => {
        const res = await fetch(`${BASE_URL}/customers/${id}`, {
            method: "DELETE",
            headers: { ...getAuthHeader() },
        });
        if (!res.ok) throw new Error("Failed to delete customer");
        set((state) => ({
            customers: state.customers.filter((c) => c.id !== id),
            lastFetched: null, // force refetch on next visit
        }));
        await get().fetchCustomers(get().lastSearch, 1, true);
    },

    invalidate: () => set({ lastFetched: null }),
}));
