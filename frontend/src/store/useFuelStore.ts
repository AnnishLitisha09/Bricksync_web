import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface Fuel {
  isVerified: boolean;
  fuelId: number;
  vehicleId: number;
  bunkId: number;
  volume: number;
  amount: number;
  date: string;
  kilometer: number;
  status?: "verified" | "not_verified";
  vehicle: {
    id: number;
    vehicleName: string;
    vehicleNumber: string;
  };
  bunk: {
    id: number;
    bunkName: string;
  };
}

interface FuelStore {
  fuels: Fuel[];
  loading: boolean;
  getFuels: () => Promise<void>;
  createFuel: (payload: {
    vehicleId: number;
    bunkId: number;
    volume: number;
    amount: number;
    date: string;
    kilometer: number;
  }) => Promise<void>;
  toggleFuelStatus: (fuelId: number) => Promise<void>;
}

export const useFuelStore = create<FuelStore>((set, get) => ({
  fuels: [],
  loading: false,

  getFuels: async () => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-fuels`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const data = await res.json();

      const formatted = data.map((f: Fuel) => ({
        ...f,
        status: f.isVerified ? "verified" : "not_verified",
      }));

      set({ fuels: formatted, loading: false });
    } catch (error) {
      console.error("Error fetching fuels:", error);
      set({ loading: false });
    }
  },

  createFuel: async (payload) => {
    try {
      set({ loading: true });
      await fetch(`${BASE_URL}/vehicle-fuels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      set({ loading: false });
      await get().getFuels();
    } catch (error) {
      console.error("Error creating fuel:", error);
      set({ loading: false });
    }
  },

  toggleFuelStatus: async (fuelId) => {
    try {
      const res = await fetch(`${BASE_URL}/vehicle-fuel/${fuelId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      const updatedFuel = await res.json();

      set({
        fuels: get().fuels.map((f) =>
          f.fuelId === fuelId
            ? {
                ...f,
                status: updatedFuel.fuel.isVerified ? "verified" : "not_verified",
              }
            : f
        ),
      });
    } catch (error) {
      console.error("Error toggling fuel status:", error);
    }
  },
}));
