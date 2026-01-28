import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface ServiceShop {
  id: number;
  shop_name: string;
  address: string;
  owner: string;
  phone: string;
  amount: number;
  type: "showroom" | "paint" | "tyre" | "others";
  createdAt: string;
  updatedAt: string;
}

interface ServiceShopStore {
  shops: ServiceShop[];
  loading: boolean;
  error: string | null;
  fetchShops: () => Promise<void>;
  createServiceShop: (payload: {
    shop_name: string;
    owner: string;
    phone: string;
    address: string;
    amount: number;
    type: ServiceShop["type"];
  }) => Promise<void>;
}

export const useServiceShopStore = create<ServiceShopStore>((set, get) => ({
  shops: [],
  loading: false,
  error: null,

  fetchShops: async () => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${BASE_URL}/service-shops`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch service shops");

      const data = await res.json();
      set({ shops: data, loading: false });
    } catch (err: any) {
      console.error(err);
      set({
        error: err.message || "Something went wrong",
        loading: false,
      });
    }
  },

  createServiceShop: async (payload) => {
    try {
      set({ loading: true });

      await fetch(`${BASE_URL}/service-shops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      set({ loading: false });
      await get().fetchShops();
    } catch (err) {
      console.error("Error creating service shop:", err);
      set({ loading: false });
    }
  },
}));
