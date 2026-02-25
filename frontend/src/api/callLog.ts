import { BASE_URL, getAuthHeader } from "./base";

export interface CallLogData {
    id?: number;
    cus_id: number;
    date: string;
    next_call_date: string;
    description: string;
    is_called?: boolean;
}

export const fetchCallLogs = async (page = 1, limit = 10, search = "") => {
    const url = new URL(`${BASE_URL}/call-logs`);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", limit.toString());
    if (search) url.searchParams.append("search", search);

    const res = await fetch(url.toString(), {
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

export const fetchTodayCalls = async () => {
    const res = await fetch(`${BASE_URL}/call-logs/today`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch today's calls");
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

export const toggleCallStatus = async (id: number) => {
    const res = await fetch(`${BASE_URL}/call-logs/${id}/status`, {
        method: "PATCH",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to toggle call status");
    return await res.json();
};

export const deleteCallLog = async (id: number) => {
    const res = await fetch(`${BASE_URL}/call-logs/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete call log");
    return await res.json();
};
