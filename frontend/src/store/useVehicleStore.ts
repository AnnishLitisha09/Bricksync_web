import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface Vehicle {
  id: number;
  vehicleName: string;
  vehicleNumber: string;
  insurance: string;
  pollution: string;
  rcDate: string;
  kilometer: number;
  isActive: boolean;

  vehicleImage?: string;
  rcImage?: string;
  insuranceImage?: string;
  pollutionImage?: string;
  speedImage?: string;
}

interface VehicleStore {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;

  fetchVehicles: () => Promise<void>;
  fetchVehicleById: (id: number) => Promise<Vehicle>;
  addVehicle: (data: FormData) => Promise<void>;
  updateVehicle: (id: number, data: FormData) => Promise<void>;

}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,

  /* 🔄 FETCH ALL VEHICLES */
  fetchVehicles: async () => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`${BASE_URL}/vehicles`, {
        headers: {
          ...getAuthHeader(),
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }

      const data = await res.json();
      set({ vehicles: data });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  /* ➕ ADD VEHICLE */
  addVehicle: async (formData: FormData) => {
    set({ loading: true, error: null });

    try {
      const res = await fetch(`${BASE_URL}/vehicles`, {
        method: "POST",
        headers: {
          ...getAuthHeader(), // ⚠️ do NOT add Content-Type when using FormData
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to add vehicle");
      }

      const newVehicle = await res.json();

      // Update store instantly after adding
      set({
        vehicles: [...get().vehicles, newVehicle],
      });
      await useVehicleStore.getState().fetchVehicles();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage });
      throw err;
    } finally {
      set({ loading: false });
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
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      set({ error: errorMessage });
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
        headers: {
          ...getAuthHeader(), // ❌ DO NOT SET content-type
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to update vehicle");
      }

      await get().fetchVehicles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      set({ error: msg });
      throw err;
    } finally {
      set({ loading: false });
    }
  },



}));
