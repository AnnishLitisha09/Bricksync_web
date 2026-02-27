import { BASE_URL, getAuthHeader } from "./base";

export const fetchTodayAttendance = async () => {
    const res = await fetch(`${BASE_URL}/attendance/today`, {
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
