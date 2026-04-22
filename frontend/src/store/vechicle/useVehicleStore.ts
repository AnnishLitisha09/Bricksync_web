import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../api/base";
import { isStale } from "../storeUtils";

export interface Vehicle {
  id: number;
  vehicleName: string;
  vehicleNumber: string;
  insurance: string;
  pollution: string;
  rcDate: string;
  kilometer: number;
  isActive: boolean;
  totalCost?: number;
  vehicleImage?: string;
  rcImage?: string;
  insuranceImage?: string;
  pollutionImage?: string;
  speedImage?: string;
  services?: any[];
  vehicleFuels?: any[];
  sparesTitles?: any[];
}

interface VehicleStore {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchVehicles: (force?: boolean) => Promise<void>;
  fetchVehicleById: (id: number) => Promise<Vehicle>;
  addVehicle: (data: FormData) => Promise<void>;
  updateVehicle: (id: number, data: FormData) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
  invalidate: () => void;
}

const TTL = 120_000; // 2 minutes

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,
  lastFetched: null,

  /* 🔄 FETCH ALL VEHICLES — skips if data is fresh */
  fetchVehicles: async (force = false) => {
    if (!force && !isStale(get().lastFetched, TTL)) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/vehicles`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      set({ vehicles: data, loading: false, lastFetched: Date.now() });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  /* ➕ ADD VEHICLE */
  addVehicle: async (formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/vehicles`, {
        method: "POST",
        headers: { ...getAuthHeader() },
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add vehicle");
      }
      get().invalidate();
      await get().fetchVehicles(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: msg, loading: false });
      throw err;
    }
  },

  fetchVehicleById: async (id: number) => {
    set({ loading: true });
    try {
      const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
        headers: getAuthHeader(),
      });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateVehicle: async (id: number, formData: FormData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
        method: "PUT",
        headers: { ...getAuthHeader() },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update vehicle");
      get().invalidate();
      await get().fetchVehicles(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      set({ error: msg, loading: false });
      throw err;
    }
  },

  deleteVehicle: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}/vehicles/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to delete vehicle");
      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id),
        lastFetched: null,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed";
      set({ error: msg, loading: false });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  invalidate: () => set({ lastFetched: null }),
}));
