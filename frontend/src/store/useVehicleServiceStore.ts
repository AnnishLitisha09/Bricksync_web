import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

export interface VehicleService {
  id: number;
  vehicleId: number;
  serviceId: number;
  serviceShopId: number;
  topic: string;
  description: string;
  date: string;
  service_img: string | null;
  amount: number;
  kilometer: number;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: number;
    vehicleName: string;
    vehicleNumber: string;
    // ... other fields
  };
  serviceShop: {
    id: number;
    shop_name: string;
    type: "showroom" | "paint" | "tyre" | "others";
    // ... other fields
  };
}

interface VehicleServiceStore {
  services: VehicleService[];
  loading: boolean;
  error: string | null;
  totalRecords: number; // Added for pagination
  currentPage: number;   // Added for pagination

  fetchServices: (page?: number) => Promise<void>;
  createService: (payload: any) => Promise<void>;
}

export const useVehicleServiceStore = create<VehicleServiceStore>((set, get) => ({
  services: [],
  loading: false,
  error: null,
  totalRecords: 0,
  currentPage: 1,

  fetchServices: async (page = 1) => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${BASE_URL}/vehicle-services?page=${page}`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch vehicle services");

      const responseData = await res.json();
      
      // FIX: Access the 'data' property from the paginated object
      set({ 
        services: responseData.data || [], 
        totalRecords: responseData.totalRecords,
        currentPage: responseData.currentPage,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createService: async (payload) => {
    try {
      set({ loading: true });
      const res = await fetch(`${BASE_URL}/vehicle-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create");
      await get().fetchServices(); 
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
}));