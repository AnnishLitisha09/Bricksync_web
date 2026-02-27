import { create } from "zustand";
import { isStale } from "./storeUtils";
import {
    getStock,
    getAllOffices,
    getEmployees,
    logProduction,
    deleteStock,
    getTodayProductionStats,
} from "../api/inventory";

export interface ProductStock {
    stock_id: number;
    product_id: number;
    office_id: number;
    quantity: string;
    product: {
        product_name: string;
        category: string;
        image_url: string;
        description: string;
    };
    office: {
        office_name: string;
    };
}

export interface Office {
    office_id: number;
    office_name: string;
}

export interface Employee {
    employee_id: number;
    employee_name: string;
}

export interface ProductionLog {
    production_id: number;
    production_date: string;
    unit_produced: string;
    cement_used: string;
    product: { product_name: string; category: string };
    office: { office_name: string };
    employees?: { employee: { name: string } }[];
}

interface StockStore {
    stock: ProductStock[];
    offices: Office[];
    employees: Employee[];
    todayLogs: ProductionLog[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;

    fetchStockData: (force?: boolean) => Promise<void>;
    logProduction: (payload: any) => Promise<void>;
    deleteStock: (stockId: number) => Promise<void>;
    invalidate: () => void;
}

const TTL = 90_000; // 90 seconds

export const useStockStore = create<StockStore>((set, get) => ({
    stock: [],
    offices: [],
    employees: [],
    todayLogs: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchStockData: async (force = false) => {
        if (!force && !isStale(get().lastFetched, TTL)) return;
        set({ loading: true, error: null });
        try {
            const [stockData, officeData, employeeData, todayData] = await Promise.all([
                getStock(),
                getAllOffices(),
                getEmployees(),
                getTodayProductionStats(),
            ]);
            set({
                stock: Array.isArray(stockData) ? stockData : [],
                offices: officeData.success ? officeData.data : Array.isArray(officeData) ? officeData : [],
                employees: employeeData.data
                    ? employeeData.data
                    : Array.isArray(employeeData)
                        ? employeeData
                        : [],
                todayLogs: Array.isArray(todayData) ? todayData : [],
                loading: false,
                lastFetched: Date.now(),
            });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    logProduction: async (payload) => {
        await logProduction(payload);
        get().invalidate();
        await get().fetchStockData(true);
    },

    deleteStock: async (stockId) => {
        await deleteStock(stockId);
        set((state) => ({
            stock: state.stock.filter((s) => s.stock_id !== stockId),
            lastFetched: null,
        }));
        await get().fetchStockData(true);
    },

    invalidate: () => set({ lastFetched: null }),
}));
