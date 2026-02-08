import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";

// Define the structure of a vehicle service record
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
    insurance: string;
    pollution: string;
    rcDate: string;
    vehicleImage: string | null;
    rcImage: string | null;
    insuranceImage: string | null;
    pollutionImage: string | null;
    speedImage: string | null;
    kilometer: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  serviceShop: {
    id: number;
    shop_name: string;
    address: string;
    owner: string;
    phone: string;
    amount: number;
    type: "showroom" | "paint" | "tyre" | "others";
    createdAt: string;
    updatedAt: string;
  };
}

// Zustand store interface
interface VehicleServiceStore {
  services: VehicleService[];
  loading: boolean;
  error: string | null;

  fetchServices: () => Promise<void>;
  createService: (payload: {
    vehicleId: number;
    serviceShopId: number;
    topic: string;
    description: string;
    date: string;
    service_img?: string | null;
    amount: number;
    kilometer: number;
  }) => Promise<void>;
}

export const useVehicleServiceStore = create<VehicleServiceStore>((set, get) => ({
  services: [],
  loading: false,
  error: null,

  fetchServices: async () => {
    try {
      set({ loading: true, error: null });

      const res = await fetch(`${BASE_URL}/vehicle-services`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch vehicle services");

      const data: VehicleService[] = await res.json();
      set({ services: data, loading: false });
    } catch (err: any) {
      console.error("Error fetching vehicle services:", err);
      set({ error: err.message || "Something went wrong", loading: false });
    }
  },

  createService: async (payload) => {
    try {
      set({ loading: true });

      const res = await fetch(`${BASE_URL}/vehicle-services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create vehicle service");

      set({ loading: false });
      await get().fetchServices(); // refresh list after creating
    } catch (err: any) {
      console.error("Error creating vehicle service:", err);
      set({ error: err.message || "Something went wrong", loading: false });
    }
  },
}));
