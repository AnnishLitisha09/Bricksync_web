import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../../api/base";

export interface VehicleService {
  id: number;
  amount: number;
  date: string;
  topic: string;
  description: string;
  kilometer: number;
  vehicleId: number;
  serviceShopId: number;
  vehicle: {
    vehicleName: string;
    vehicleNumber: string;
  };
  serviceShop: {
    id: number;
    shop_name: string;
    type: "showroom" | "paint" | "tyre" | "others";
  };
}

interface VehicleServiceStore {
  services: VehicleService[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  fetchServices: (page?: number) => Promise<void>;
  fetchServicesByShop: (shopId: number | string) => Promise<VehicleService[]>;
  searchServices: (query: string) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
}

export const useVehicleServiceStore = create<VehicleServiceStore>((set, get) => ({
  services: [],
  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,

  fetchServices: async (page = 1) => {
    try {
      set({ loading: true, error: null });
      const res = await fetch(`${BASE_URL}/vehicle-services?page=${page}`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      
      set({ 
        services: data.data || [], 
        totalPages: data.totalPages || 1,
        currentPage: page,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchServicesByShop: async (shopId: number | string) => {
    try {
      const res = await fetch(`${BASE_URL}/vehicle-services/shop/${shopId}`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Failed to fetch shop services");
      const data = await res.json();
      // Returns the array directly for the component to handle
      return Array.isArray(data) ? data : data.data || [];
    } catch (err: any) {
      console.error(err.message);
      return [];
    }
  },

  searchServices: async (query: string) => {
    try {
      set({ loading: true, error: null });
      const res = await fetch(`${BASE_URL}/vehicle-services?vehicleNumber=${query}`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      set({ 
        services: data.data || data, 
        loading: false,
        totalPages: 1 
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  
  deleteService: async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/vehicle-services/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error("Delete failed");
      await get().fetchServices(get().currentPage);
    } catch (err: any) {
      set({ error: err.message });
    }
  }
}));