import { BASE_URL, getAuthHeader } from "./base";

export const getAllSpares = async () => {
    const res = await fetch(`${BASE_URL}/spares`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch all spares");
    return await res.json();
};

export const getVehicleSpares = async (vehicleId: number) => {
    const res = await fetch(`${BASE_URL}/spares/vehicle/${vehicleId}`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch spares");
    return await res.json();
};

export const createSparesEntry = async (formData: FormData) => {
    const res = await fetch(`${BASE_URL}/spares`, {
        method: "POST",
        headers: {
            "Authorization": getAuthHeader().Authorization,
            // Don't set Content-Type, browser will set it with boundary for FormData
        },
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to create spares entry");
    return await res.json();
};

export const deleteSparesEntry = async (id: number) => {
    const res = await fetch(`${BASE_URL}/spares/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete spares entry");
    return await res.json();
};
