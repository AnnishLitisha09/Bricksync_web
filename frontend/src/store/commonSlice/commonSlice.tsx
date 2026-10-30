import type { StateCreator } from 'zustand';
import type { CommonStoreSliceTypes } from './types';

const DOCK_STORAGE_KEY = 'bricksync_sidebar_dock_mode';

const getInitialDockMode = (): boolean => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = window.localStorage.getItem(DOCK_STORAGE_KEY);
            if (stored !== null) {
                return stored === 'true';
            }
        }
    } catch (e) {
        console.error('Error reading dock mode preference from localStorage:', e);
    }
    // Default to false (expanded sidebar navigation) so the full software navigation model is visible by default
    return false;
};

export const CommonStoreSlice: StateCreator<CommonStoreSliceTypes> = (set) => ({
    isOpen: false,
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setIsOpen: (val) => set({ isOpen: val }),
    isDockMode: getInitialDockMode(),
    toggleDockMode: () =>
        set((state) => {
            const nextMode = !state.isDockMode;
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(DOCK_STORAGE_KEY, String(nextMode));
                }
            } catch (e) {
                console.error('Error saving dock mode preference to localStorage:', e);
            }
            return { isDockMode: nextMode };
        }),
    setDockMode: (val) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(DOCK_STORAGE_KEY, String(val));
            }
        } catch (e) {
            console.error('Error saving dock mode preference to localStorage:', e);
        }
        set({ isDockMode: val });
    },
});


