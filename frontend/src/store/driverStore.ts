import { create } from "zustand";

export type DriverType = {
  userid: number;
  name: string;
  email: string;
  phoneNumber: string;
  amount: number;
  imageUrl: string | null;
  aadharUrl?: string | null;
  drivingLicenceUrl?: string | null;
  drivingLicenceBackUrl?: string | null;
  status?: "Active" | "Inactive";
};

type DriverState = {
  drivers: DriverType[];
  setDrivers: (data: DriverType[]) => void;
  clearDrivers: () => void;
};

export const useDriverStore = create<DriverState>((set) => ({
  drivers: [],
  setDrivers: (data) => set({ drivers: data }),
  clearDrivers: () => set({ drivers: [] }),
}));
