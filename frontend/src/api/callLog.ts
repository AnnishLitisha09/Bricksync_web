import { BASE_URL, getAuthHeader } from "./base";

export interface CallLogData {
    id?: number;
    cus_id: number;
    date: string;
    next_call_date: string;
    description: string;
}

export const fetchCallLogs = async () => {
    const res = await fetch(`${BASE_URL}/call-logs`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch call logs");
    return await res.json();
};

export const fetchNextCalls = async () => {
    const res = await fetch(`${BASE_URL}/call-logs/next-calls`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch next calls");
    return await res.json();
};

export const createCallLog = async (data: CallLogData) => {
    const res = await fetch(`${BASE_URL}/call-logs`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create call log");
    return await res.json();
};
