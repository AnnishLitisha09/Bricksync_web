import { create } from 'zustand';
import { BASE_URL, getAuthHeader } from '../api/base';

interface Bank {
    id: number;
    name: string;
    accountNumber: string;
    holderName: string;
    amount: number;
    Gpay: boolean;
}

interface BankState {
    banks: Bank[];
    loading: boolean;
    error: string | null;
    fetchBanks: () => Promise<void>;
}

export const useBankStore = create<BankState>((set) => ({
    banks: [],
    loading: false,
    error: null,
    fetchBanks: async () => {
        set({ loading: true });
        try {
            const response = await fetch(`${BASE_URL}/banks`, {
                method: 'GET',
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch banks');
            const data = await response.json();
            set({ banks: data, loading: false, error: null });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },
}));