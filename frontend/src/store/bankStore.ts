import { create } from 'zustand';
import { BASE_URL, getAuthHeader } from '../api/base';
import { isStale } from './storeUtils';

interface Bank {
    id: number;
    name: string;
    accountNumber: string;
    holderName: string;
    amount: number;
    bankTransfer: boolean;
    phonepe: boolean;
    gpay: boolean;
}

interface BankState {
    banks: Bank[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    fetchBanks: (force?: boolean) => Promise<void>;
    addBank: (data: Omit<Bank, 'id'>) => Promise<void>;
    invalidate: () => void;
}

const TTL = 120_000; // 2 minutes

export const useBankStore = create<BankState>((set, get) => ({
    banks: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchBanks: async (force = false) => {
        if (!force && !isStale(get().lastFetched, TTL)) return;
        set({ loading: true });
        try {
            const response = await fetch(`${BASE_URL}/banks`, {
                method: 'GET',
                headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to fetch banks');
            const result = await response.json();
            const bankList = Array.isArray(result.data) ? result.data : [];
            set({ banks: bankList, loading: false, error: null, lastFetched: Date.now() });
        } catch (error: any) {
            set({ error: error.message, loading: false, banks: [] });
        }
    },

    addBank: async (data) => {
        const response = await fetch(`${BASE_URL}/banks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to create bank account');
        }
        get().invalidate();
        await get().fetchBanks(true);
    },

    invalidate: () => set({ lastFetched: null }),
}));