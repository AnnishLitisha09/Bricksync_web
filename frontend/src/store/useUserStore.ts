import { create } from "zustand";
import { BASE_URL } from "../api/base";

export interface User {
  userid: number;
  name: string;
  email: string;
  phoneNumber: string;
  amount: number;
  imageUrl?: string | null;

  // Document URLs
  aadharUrl?: string | null;
  drivingLicenceUrl?: string | null;
  drivingLicenceBackUrl?: string | null;
  drivingLicenceValidity?: string | null;

  userRole: number;
}

interface UserState {
  token: string | null;
  user: User | null;
  loading: boolean;

  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  fetchProfile: () => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem("token"),
  user: null,
  loading: false,

  setToken: (token) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    set({ token });
  },

  setUser: (user) => set({ user }),

  fetchProfile: async () => {
    const token = get().token;
    if (!token) return;

    set({ loading: true });

    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Invalid token");

      const data: User = await res.json();
      set({ user: data });
    } catch (err) {
      console.error("Profile fetch failed", err);
      localStorage.removeItem("token");
      set({ token: null, user: null });
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },
}));
