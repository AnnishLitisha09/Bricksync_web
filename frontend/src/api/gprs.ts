import { BASE_URL, getAuthHeader } from "./base";

export const syncGprsData = async () => {
    const response = await fetch(`${BASE_URL}/gprs/sync`, {
        method: "POST",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
    });
    return response.json();
};

export const getGprsSummary = async () => {
    const response = await fetch(`${BASE_URL}/gprs/summary`, {
        headers: getAuthHeader(),
    });
    return response.json();
};

export const getVehicleLiveData = async (vehicleNumber: string) => {
    const response = await fetch(`${BASE_URL}/gprs/live/${vehicleNumber}`, {
        headers: getAuthHeader(),
    });
    return response.json();
};

export const assignDriver = async (vehicleNumber: string, driverName: string) => {
    const response = await fetch(`${BASE_URL}/gprs/assign`, {
        method: "POST",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ vehicleNumber, driverName }),
    });
    return response.json();
};
