import { BASE_URL, getAuthHeader } from "./base";

export const fetchTodayAttendance = async (date?: string) => {
    const url = date ? `${BASE_URL}/attendance/today?date=${date}` : `${BASE_URL}/attendance/today`;
    const res = await fetch(url, {
        headers: getAuthHeader(),
    });
    return await res.json();
};

export const saveAttendance = async (payload: { userid: number; records: { date: string; forenoon: boolean; afternoon: boolean }[] }) => {
    const res = await fetch(`${BASE_URL}/attendance/save`, {
        method: "POST",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    return await res.json();
};
