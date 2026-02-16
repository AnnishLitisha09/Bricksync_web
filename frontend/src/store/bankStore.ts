import { create } from 'zustand';
import { BASE_URL, getAuthHeader } from '../api/base';

interface Bank {
    id: number;
    name: string;
    accountNumber: string;
    holderName: string;
    amount: number;
    bankTransfer: boolean;
    phonepe: boolean;
    gpay: boolean; // Match API response key
}

interface BankState {
    banks: Bank[];
    loading: boolean;
    error: string | null;
    fetchBanks: () => Promise<void>;
}

export const useBankStore = create<BankState>((set) => ({
    banks: [], // Initialize as empty array
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
            
            const result = await response.json();
            
            // Extract the array from result.data
            const bankList = Array.isArray(result.data) ? result.data : [];
            
            set({ banks: bankList, loading: false, error: null });
        } catch (error: any) {
            set({ error: error.message, loading: false, banks: [] });
        }
    },
}));