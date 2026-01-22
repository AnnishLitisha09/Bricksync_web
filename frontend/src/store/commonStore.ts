// src/store/commonStore.ts
import { create } from "zustand";

interface CommonState {
  isOpen: boolean;
  toggle: () => void;
  resetUI: () => void;
  user: any;
  setUser: (user: any) => void;
}

export const useCommonStore = create<CommonState>((set) => ({
  isOpen: true,

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  resetUI: () => set({ isOpen: false }),

  user: null,

  setUser: (user: any) => set({ user }),
}));
