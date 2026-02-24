import { BASE_URL, getAuthHeader } from "./base";

export interface StatementData {
    statement_id?: number;
    cus_id: number;
    bank_type: string;
    bank_id?: number | null;
    amount: number;
    description?: string;
}

export const fetchStatements = async () => {
    const res = await fetch(`${BASE_URL}/customer-statements`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Failed to fetch statements");
    return await res.json();
};

export const createStatement = async (data: StatementData) => {
    const res = await fetch(`${BASE_URL}/customer-statements`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create statement");
    return await res.json();
};

export const updateStatement = async (id: number, data: StatementData) => {
    const res = await fetch(`${BASE_URL}/customer-statements/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update statement");
    return await res.json();
};

export const deleteStatement = async (id: number) => {
    const res = await fetch(`${BASE_URL}/customer-statements/${id}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeader(),
        },
    });
    if (!res.ok) throw new Error("Failed to delete statement");
    return await res.json();
};
