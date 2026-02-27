import { create } from "zustand";
import { BASE_URL, getAuthHeader } from "../api/base";
import { isStale } from "./storeUtils";
import { fetchTodayAttendance, saveAttendance } from "../api/attendance";

export interface AttendanceRecord {
    userid: number;
    name: string;
    imageUrl?: string;
    forenoon: boolean;
    afternoon: boolean;
    Attendances?: { forenoon: boolean; afternoon: boolean }[];
}

interface AttendanceStore {
    attendance: AttendanceRecord[];
    loading: boolean;
    saving: boolean;
    error: string | null;
    lastFetched: number | null;

    fetchAttendance: (force?: boolean) => Promise<void>;
    toggleAttendance: (userid: number, field: "forenoon" | "afternoon") => void;
    saveAllAttendance: () => Promise<void>;
    invalidate: () => void;
}

const TTL = 60_000; // 1 min – attendance changes frequently

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
    attendance: [],
    loading: false,
    saving: false,
    error: null,
    lastFetched: null,

    fetchAttendance: async (force = false) => {
        if (!force && !isStale(get().lastFetched, TTL)) return;
        set({ loading: true, error: null });
        try {
            const data = await fetchTodayAttendance();
            const formatted = data.map((staff: any) => ({
                ...staff,
                forenoon: staff.Attendances?.[0]?.forenoon || false,
                afternoon: staff.Attendances?.[0]?.afternoon || false,
            }));
            set({ attendance: formatted, loading: false, lastFetched: Date.now() });
        } catch (err: any) {
            set({ error: err.message, loading: false });
        }
    },

    toggleAttendance: (userid, field) => {
        set((state) => ({
            attendance: state.attendance.map((staff) =>
                staff.userid === userid ? { ...staff, [field]: !staff[field] } : staff
            ),
        }));
    },

    saveAllAttendance: async () => {
        set({ saving: true });
        try {
            const today = new Date().toISOString().slice(0, 10);
            const { attendance } = get();
            const promises = attendance.map((staff) =>
                saveAttendance({
                    userid: staff.userid,
                    records: [{ date: today, forenoon: staff.forenoon, afternoon: staff.afternoon }],
                })
            );
            await Promise.all(promises);
            get().invalidate();
            await get().fetchAttendance(true);
        } finally {
            set({ saving: false });
        }
    },

    invalidate: () => set({ lastFetched: null }),
}));
