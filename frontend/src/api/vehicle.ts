import { BASE_URL, getAuthHeader } from "./base";

export const fetchVehicles = async () => {
    const res = await fetch(`${BASE_URL}/vehicles`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch vehicles");
    return await res.json();
};
