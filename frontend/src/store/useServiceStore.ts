// src/store/useServiceStore.ts
import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface ServiceShop {
  id: number;
  shop_name: string;
  address: string;
  owner: string;
  phone: string;
  amount: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStore {
  shops: ServiceShop[];
  loading: boolean;
  getShops: () => Promise<void>;
  createShop: (payload: {
    shop_name: string;
    address: string;
    owner: string;
    phone: string;
    amount: number;
    type: string;
  }) => Promise<void>;
  // Optional: update or delete actions can be added here
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  shops: [],
  loading: false,

  getShops: async () => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/service-shops`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const data: ServiceShop[] = await res.json();
      set({ shops: data, loading: false });
    } catch (error) {
      console.error("Error fetching service shops:", error);
      set({ loading: false });
    }
  },

  createShop: async (payload) => {
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
      await get().getShops(); // refresh list after creating
    } catch (error) {
      console.error("Error creating service shop:", error);
      set({ loading: false });
    }
  },
}));
