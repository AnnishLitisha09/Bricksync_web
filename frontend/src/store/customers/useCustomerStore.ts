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
    total_sales?: number;
    total_paid?: number;
    last_called_date?: string | null;
}

export interface CustomerSummary {
    totalClients: number;
    dueCount: number;
    totalOutstanding: number;
}

interface CustomerStore {
    customers: CustomerData[];
    totalCustomers: number;
    summary: CustomerSummary | null;
    loading: boolean;
    loadingMore: boolean;
    error: string | null;
    lastFetched: number | null;
    lastSearch: string;
    lastPage: number;
    lastSortBy: string;
    lastSortOrder: string;

    /** Fetches customers, respects TTL cache. Pass force=true to skip cache. Pass append=true to add results to current list. */
    fetchCustomers: (search?: string, page?: number, force?: boolean, append?: boolean, sortBy?: string, sortOrder?: string) => Promise<void>;
    createCustomer: (data: Omit<CustomerData, "id">) => Promise<void>;
    updateCustomer: (id: number, data: Partial<CustomerData>) => Promise<void>;
    deleteCustomer: (id: number) => Promise<void>;
    invalidate: () => void;
}

const TTL = 60_000; // 1 min – customer list changes often
const DEFAULT_LIMIT = 20;

let currentRequestId = 0;

const dedupeCustomers = (list: CustomerData[]): CustomerData[] => {
    const seen = new Set<number>();
    const result: CustomerData[] = [];
    for (const item of list) {
        if (item.id !== undefined) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                result.push(item);
            }
        } else {
            result.push(item);
        }
    }
    return result;
};

export const useCustomerStore = create<CustomerStore>((set, get) => ({
    customers: [],
    totalCustomers: 0,
    summary: null,
    loading: false,
    loadingMore: false,
    error: null,
    lastFetched: null,
    lastSearch: "",
    lastPage: 1,
    lastSortBy: "name",
    lastSortOrder: "ASC",

    fetchCustomers: async (search = "", page = 1, force = false, append = false, sortBy = "name", sortOrder = "ASC") => {
        const { lastFetched, lastSearch, lastPage, lastSortBy, lastSortOrder, customers: currentCustomers } = get();
        const sameQuery = search === lastSearch && page === lastPage && sortBy === lastSortBy && sortOrder === lastSortOrder;

        // Skip fetch if valid cache hit
        if (!force && sameQuery && !isStale(lastFetched, TTL)) return;

        const requestId = ++currentRequestId;

        if (append) {
            set({ loadingMore: true, error: null });
        } else {
            set({ loading: true, error: null });
        }

        try {
            const url = `${BASE_URL}/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${DEFAULT_LIMIT}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
            const res = await fetch(url, { headers: { ...getAuthHeader() } });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || `Failed to fetch customers (${res.status})`);
            }

            const data = await res.json();

            // Discard stale responses if a newer request was dispatched
            if (requestId !== currentRequestId) return;

            const fetchedList: CustomerData[] = data.data || [];
            const mergedList = append ? dedupeCustomers([...currentCustomers, ...fetchedList]) : fetchedList;
            const totalCount = data.pagination?.total ?? mergedList.length;

            const summaryData: CustomerSummary = data.summary || {
                totalClients: totalCount,
                dueCount: mergedList.filter(c => Number(c.balance) > 0).length,
                totalOutstanding: mergedList.reduce((s, c) => s + Number(c.balance || 0), 0)
            };

            set({
                customers: mergedList,
                totalCustomers: totalCount,
                summary: summaryData,
                loading: false,
                loadingMore: false,
                error: null,
                lastFetched: Date.now(),
                lastSearch: search,
                lastPage: page,
                lastSortBy: sortBy,
                lastSortOrder: sortOrder,
            });
        } catch (err: any) {
            if (requestId === currentRequestId) {
                set({
                    error: err.message || "Failed to load customers. Please check network connection.",
                    loading: false,
                    loadingMore: false
                });
            }
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
