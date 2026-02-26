import { BASE_URL, getAuthHeader } from "./base";

export interface OrderItem {
    id?: number;
    order_id?: number;
    product: string;
    office_id?: number;
    material_id?: number;
    quantity: number;
    price: number;
    vehicle_id?: number;
    driver_ids?: number[];
    loader_ids?: number[];
}

export interface OrderData {
    order_id?: number;
    cus_id: number;
    date: string;
    items: OrderItem[];
    transport_charge?: number;
}

export const fetchOrders = async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return await res.json();
};

export const createOrder = async (data: OrderData) => {
    const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create order");
    return await res.json();
};
export const updateOrder = async (id: number, data: any) => {
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update order");
    return await res.json();
};

export const deleteOrder = async (id: number) => {
    const res = await fetch(`${BASE_URL}/orders/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete order");
    return await res.json();
};

export const bulkImportOrders = async (payload: {
    cus_id: number;
    orders: { date: string; orderNumber: string; items: { product: string; qty: number; rate: number }[] }[];
    payments: { date: string; method: string; amount: number }[];
    openingBalance?: number;
}) => {
    const res = await fetch(`${BASE_URL}/orders/bulk-import`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Bulk import failed");
    return await res.json();
};
