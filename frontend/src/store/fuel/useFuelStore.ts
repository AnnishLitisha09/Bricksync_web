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
  fuelBunk: { // Updated to match API key
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
  createFuel: (payload: any) => Promise<void>;
  toggleFuelStatus: (fuelId: number) => Promise<void>;
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

      // Data is now { totalRecords, currentPage, totalPages, fuels: [] }
      set({ 
        fuels: data.fuels || [], 
        totalRecords: data.totalRecords,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching fuels:", error);
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
        // Refresh current page to get updated status
        await get().getFuels(get().currentPage);
      }
    } catch (error) {
      console.error("Error toggling fuel status:", error);
    }
  },
}));