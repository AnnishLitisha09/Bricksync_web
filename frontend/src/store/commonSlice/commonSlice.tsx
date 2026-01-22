import type { StateCreator } from 'zustand';
import type { CommonStoreSliceTypes } from './types';

export const CommonStoreSlice: StateCreator<CommonStoreSliceTypes> = (set) => ({
    isOpen: true,
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setIsOpen: (val) => set({ isOpen: val }),
});
