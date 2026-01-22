import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../../api/base";


export interface Bunk {
  id: number;
  bunkName: string;
  ownerName: string;
  phoneNumber: string;
  address: string;
  amount: number;
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

export const useBunkStore = create<BunkStore>((set, get) => ({
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
      set({ bunks: data, loading: false });
    } catch (error) {
      console.error("Error fetching bunks:", error);
      set({ error: "Failed to fetch bunks", loading: false });
    }
  },

  createBunk: async (payload) => {
    try {
      set({ loading: true });

      await fetch(`${BASE_URL}/bunks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      set({ loading: false });
      await get().fetchBunks();
    } catch (error) {
      console.error("Error creating bunk:", error);
      set({ loading: false });
    }
  },
}));
