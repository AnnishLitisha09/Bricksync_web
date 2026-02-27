import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../api/base";
import { isStale } from "../storeUtils";

export interface Fuel {
  fuelId: number;
  vehicleId: number;
  bunkId: number;
  volume: number;
  amount: number;
  date: string;
  kilometer: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  vehicle: { id: number; vehicleName: string; vehicleNumber: string };
  fuelBunk: { id: number; bunkName: string };
}

interface FuelStore {
  fuels: Fuel[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  lastFetched: number | null;

  getFuels: (page?: number, force?: boolean) => Promise<void>;
  getFuelsByBunk: (bunkId: number | string) => Promise<Fuel[]>;
  searchFuels: (vehicleNumber: string) => Promise<void>;
  createFuel: (payload: any) => Promise<void>;
  toggleFuelStatus: (fuelId: number) => Promise<void>;
  deleteFuel: (fuelId: number) => Promise<void>;
  invalidate: () => void;
}

const TTL = 60_000; // 1 minute – fuel changes frequently

export const useFuelStore = create<FuelStore>((set, get) => ({
  fuels: [],
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  loading: false,
  lastFetched: null,

  getFuels: async (page = 1, force = false) => {
    const { lastFetched, currentPage } = get();
    if (!force && page === currentPage && !isStale(lastFetched, TTL)) return;
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-fuels?page=${page}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      const data = await res.json();
      set({
        fuels: data.fuels || [],
        totalRecords: data.totalRecords || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      console.error("Error fetching fuels:", error);
      set({ loading: false, fuels: [] });
    }
  },

  getFuelsByBunk: async (bunkId: number | string) => {
    try {
      const res = await fetch(`${BASE_URL}/vehicle-fuels/search/by-bunk-id?bunkId=${bunkId}`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      return Array.isArray(data) ? data : data.fuels || [];
    } catch (error) {
      console.error("Error fetching fuels by bunk:", error);
      return [];
    }
  },

  searchFuels: async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) {
      await get().getFuels(1, true);
      return;
    }
    try {
      set({ loading: true });
      const res = await fetch(
        `${BASE_URL}/vehicle-fuels/search/by-vehicle-number?vehicleNumber=${encodeURIComponent(vehicleNumber)}`,
        { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
      );
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.fuels || [];
      set({ fuels: results, totalRecords: results.length, totalPages: 1, currentPage: 1, loading: false });
    } catch (error) {
      set({ loading: false, fuels: [] });
    }
  },

  createFuel: async (payload) => {
    try {
      set({ loading: true });
      await fetch(`${BASE_URL}/vehicle-fuels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      get().invalidate();
      await get().getFuels(get().currentPage, true);
    } catch (error) {
      set({ loading: false });
    }
  },

  toggleFuelStatus: async (fuelId) => {
    try {
      const res = await fetch(`${BASE_URL}/vehicle-fuels/${fuelId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
      });
      if (res.ok) {
        get().invalidate();
        await get().getFuels(get().currentPage, true);
      }
    } catch (error) {
      console.error(error);
    }
  },

  deleteFuel: async (fuelId: number) => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-fuels/${fuelId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const { fuels, currentPage } = get();
        const newPage = fuels.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        get().invalidate();
        await get().getFuels(newPage, true);
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
    }
  },

  invalidate: () => set({ lastFetched: null }),
}));