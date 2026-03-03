import { BASE_URL, getAuthHeader } from "./base";

export interface CustomerData {
    id?: number;
    name: string;
    email: string;
    phone_no: string;
    address: string;
    balance: number;
    category: 'engineer' | 'shop' | 'other';
    is_deleted?: boolean;
}

export const fetchCustomers = async (search: string = "", page: number = 1, limit: number = 10) => {
    const res = await fetch(`${BASE_URL}/customers?search=${search}&page=${page}&limit=${limit}`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch customers");
    return await res.json();
};

export const fetchCustomerById = async (id: number | string) => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch customer");
    return await res.json();
};

export const createCustomer = async (data: CustomerData) => {
    const res = await fetch(`${BASE_URL}/customers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create customer");
    return await res.json();
};

export const updateCustomer = async (id: number, data: Partial<CustomerData>) => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update customer");
    return await res.json();
};

export const deleteCustomer = async (id: number) => {
    const res = await fetch(`${BASE_URL}/customers/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete customer");
    return await res.json();
};
export const deleteCustomerStatement = async (id: number) => {
    const res = await fetch(`${BASE_URL}/customers/statements/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to delete statement");
    return await res.json();
};

export const bulkCreateCustomers = async (customers: CustomerData[]) => {
    const res = await fetch(`${BASE_URL}/customers/bulk-create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify({ customers }),
    });
    if (!res.ok) throw new Error("Bulk creation failed");
    return await res.json();
};
