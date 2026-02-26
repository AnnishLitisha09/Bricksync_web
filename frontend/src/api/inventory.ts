import { BASE_URL, getAuthHeader } from "./base";

/* 🏢 OFFICES */
export const getAllOffices = async () => {
    const res = await fetch(`${BASE_URL}/offices`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch offices");
    return await res.json();
};

export const getOfficeSummary = async () => {
    const res = await fetch(`${BASE_URL}/offices/summary`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch office summary");
    return await res.json();
};

/* 📦 PRODUCTS */
export const getAllProducts = async () => {
    const res = await fetch(`${BASE_URL}/products`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return await res.json();
};

export const createProduct = async (formData: FormData) => {
    const res = await fetch(`${BASE_URL}/products`, {
        method: "POST",
        headers: {
            ...getAuthHeader(),
        },
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to create product");
    return await res.json();
};

export const updateProduct = async (productId: number, formData: FormData) => {
    const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
            ...getAuthHeader(),
        },
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to update product");
    return await res.json();
};

/* 📊 STOCK */
export const getStock = async (office_id?: string) => {
    const url = office_id ? `${BASE_URL}/stock?office_id=${office_id}` : `${BASE_URL}/stock`;
    const res = await fetch(url, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch stock");
    return await res.json();
};

export const getLowStock = async () => {
    const res = await fetch(`${BASE_URL}/stock/low-stock`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch low stock list");
    return await res.json();
};

export const getCementUsage = async () => {
    const res = await fetch(`${BASE_URL}/stock/cement-usage`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch cement usage");
    return await res.json();
};

/* 🏭 PRODUCTION */
export const logProduction = async (productionData: any) => {
    const res = await fetch(`${BASE_URL}/production`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(productionData),
    });
    if (!res.ok) throw new Error("Failed to log production");
    return await res.json();
};

export const getProductionHistory = async () => {
    const res = await fetch(`${BASE_URL}/production/history`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch production history");
    return await res.json();
};

export const getTodayProductionStats = async () => {
    const res = await fetch(`${BASE_URL}/production/today-production`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch today's production stats");
    return await res.json();
};

/* 👥 EMPLOYEES (Fetched for production) */
export const getEmployees = async () => {
    const res = await fetch(`${BASE_URL}/employees`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch staff");
    return await res.json();
};

export const deleteStock = async (stockId: number) => {
    const res = await fetch(`${BASE_URL}/stock/${stockId}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeader(),
        },
    });
    if (!res.ok) throw new Error("Failed to delete stock");
    return await res.json();
};

export const updateStock = async (stockId: number, quantity: number) => {
    const res = await fetch(`${BASE_URL}/stock/${stockId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error("Failed to update stock");
    return await res.json();
};

export const deleteProductionLog = async (id: number) => {
    const res = await fetch(`${BASE_URL}/production/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete production log");
    return await res.json();
};
