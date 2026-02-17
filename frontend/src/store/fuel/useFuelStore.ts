import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../api/base";

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
  vehicle: {
    id: number;
    vehicleName: string;
    vehicleNumber: string;
  };
  fuelBunk: {
    id: number;
    bunkName: string;
  };
}

interface FuelStore {
  fuels: Fuel[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  getFuels: (page?: number) => Promise<void>;
  searchFuels: (vehicleNumber: string) => Promise<void>;
  createFuel: (payload: any) => Promise<void>;
  toggleFuelStatus: (fuelId: number) => Promise<void>;
  deleteFuel: (fuelId: number) => Promise<void>;
}

export const useFuelStore = create<FuelStore>((set, get) => ({
  fuels: [],
  totalRecords: 0,
  totalPages: 1,
  currentPage: 1,
  loading: false,

  getFuels: async (page = 1) => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-fuels?page=${page}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const data = await res.json();
      set({ 
        fuels: data.fuels || [], 
        totalRecords: data.totalRecords || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching fuels:", error);
      set({ loading: false, fuels: [] });
    }
  },

  searchFuels: async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) {
      await get().getFuels(1);
      return;
    }
    try {
      set({ loading: true });
      const res = await fetch(
        `${BASE_URL}/vehicle-fuels/search/by-vehicle-number?vehicleNumber=${encodeURIComponent(vehicleNumber)}`, 
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );
      const data = await res.json();
      const results = Array.isArray(data) ? data : (data.fuels || []);
      
      set({ 
        fuels: results, 
        totalRecords: results.length,
        totalPages: 1, 
        currentPage: 1,
        loading: false 
      });
    } catch (error) {
      console.error("Search error:", error);
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
      await get().getFuels(get().currentPage);
    } catch (error) {
      console.error("Error creating fuel:", error);
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
        await get().getFuels(get().currentPage);
      }
    } catch (error) {
      console.error("Error toggling fuel status:", error);
    }
  },

  deleteFuel: async (fuelId: number) => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-fuels/${fuelId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
        },
      });

      if (res.ok) {
        const { fuels, currentPage } = get();
        // If it was the last item on the page, go back one page
        const newPage = fuels.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        await get().getFuels(newPage);
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("Error deleting fuel:", error);
      set({ loading: false });
    }
  },
}));