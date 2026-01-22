/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface Bunk {
  id: number;
  bunkName: string;
  ownerName: string;
  phoneNumber: string;
  address: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface BunkStore {
  bunks: Bunk[];
  loading: boolean;
  error: string | null;
  fetchBunks: () => Promise<void>;
  createBunk: (payload: {
    bunkName: string;
    ownerName: string;
    phoneNumber: string;
    address: string;
    amount: number;
  }) => Promise<void>;
}

export const useBunkStore = create<BunkStore>((set,get) => ({
  bunks: [],
  loading: false,
  error: null,

  fetchBunks: async () => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${BASE_URL}/bunks`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch bunks");

      set({ bunks: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  createBunk: async (payload) => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${BASE_URL}/bunks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bunk");

      set({ loading: false });

      // refresh list after add
      await get().fetchBunks();
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err; // optional, but good for future toast handling
    }
  },
}));
