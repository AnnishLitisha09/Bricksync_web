import { BASE_URL, getAuthHeader } from "./base";

export const fetchBanks = async () => {
    const res = await fetch(`${BASE_URL}/banks`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch banks");
    return await res.json();
};
