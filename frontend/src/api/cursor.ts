import { BASE_URL, getAuthHeader } from "./base";

export interface CursorProduct {
  id: number;
  cursor_id: number;
  product_name: string;
  category: string;
  product_id?: number | null;
  is_deleted?: boolean;
}

export interface CursorLoad {
  id: number;
  cursor_id: number;
  cursor_product_id?: number | null;
  product_name: string;
  category?: string | null;
  product_id?: number | null;
  vehicle_id?: number | null;
  vehicle_number: string;
  driver_id?: number | null;
  driver_name: string;
  qty: number;
  remaining_qty: number;
  price_per_qty: number;
  has_loading_charge?: boolean;
  loading_charge_per_unit?: number;
  customer_name?: string | null;
  customer_id?: number | null;
  date: string;
  status: "loaded" | "delivered" | string;
  notes?: string | null;
  cursor?: {
    id: number;
    name: string;
    location?: string;
    phone?: string;
  };
  vehicle?: {
    id: number;
    vehicleName: string;
    vehicleNumber: string;
  };
  driver?: {
    employee_id: number;
    employee_name: string;
  };
}

export interface CursorItem {
  id: number;
  name: string;
  phone?: string | null;
  location?: string | null;
  notes?: string | null;
  productsCount?: number;
  totalLoadsCount?: number;
  activeLoadedCount?: number;
  deliveredCount?: number;
  activeLoadedQty?: number;
  products?: CursorProduct[];
  loads?: CursorLoad[];
  createdAt?: string;
}

export interface BranchDeliveryLog {
  id: number;
  office_id: number;
  cursor_load_id?: number | null;
  product_name: string;
  category?: string | null;
  product_id?: number | null;
  quantity: number;
  price: number;
  vehicle_id?: number | null;
  vehicle_number?: string | null;
  driver_name?: string | null;
  date: string;
  is_added_to_stock: boolean;
  notes?: string | null;
  office?: {
    office_id: number;
    office_name: string;
    location?: string;
  };
  cursorLoad?: {
    id: number;
    cursor_id: number;
    price_per_qty: number;
    date: string;
    cursor?: {
      id: number;
      name: string;
    };
  };
}

/* =========================================================================
   CURSOR ENDPOINTS
   ========================================================================= */

export const fetchCursors = async (): Promise<{ success: boolean; data: CursorItem[] }> => {
  const res = await fetch(`${BASE_URL}/cursors`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch cursors");
  return await res.json();
};

export const fetchCursorById = async (id: number | string): Promise<{ success: boolean; data: CursorItem }> => {
  const res = await fetch(`${BASE_URL}/cursors/${id}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch cursor details");
  return await res.json();
};

export const createCursor = async (data: {
  name: string;
  phone?: string;
  location?: string;
  notes?: string;
}): Promise<{ success: boolean; data: CursorItem }> => {
  const res = await fetch(`${BASE_URL}/cursors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to create cursor");
  return json;
};

export const updateCursor = async (
  id: number | string,
  data: Partial<CursorItem>
): Promise<{ success: boolean; data: CursorItem }> => {
  const res = await fetch(`${BASE_URL}/cursors/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to update cursor");
  return json;
};

export const deleteCursor = async (id: number | string): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${BASE_URL}/cursors/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to delete cursor");
  return json;
};

/* =========================================================================
   CURSOR PRODUCTS
   ========================================================================= */

export const addCursorProduct = async (
  cursorId: number | string,
  data: { product_name: string; category: string }
): Promise<{ success: boolean; data: CursorProduct }> => {
  const res = await fetch(`${BASE_URL}/cursors/${cursorId}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to add product to cursor");
  return json;
};

export const deleteCursorProduct = async (
  productId: number | string
): Promise<{ success: boolean; message: string }> => {
  const res = await fetch(`${BASE_URL}/cursors/products/${productId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to delete cursor product");
  return json;
};

/* =========================================================================
   CURSOR LOADS
   ========================================================================= */

export const createCursorLoad = async (
  cursorId: number | string,
  data: {
    cursor_product_id?: number | null;
    product_name: string;
    category?: string;
    vehicle_id?: number | null;
    vehicle_number: string;
    driver_id?: number | null;
    driver_name: string;
    qty: number;
    price_per_qty: number;
    has_loading_charge?: boolean;
    loading_charge_per_unit?: number;
    customer_id?: number | null;
    customer_name?: string | null;
    date?: string;
    notes?: string;
  }
): Promise<{ success: boolean; data: CursorLoad }> => {
  const res = await fetch(`${BASE_URL}/cursors/${cursorId}/loads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to record loading");
  return json;
};

export const fetchLoadedMaterials = async (): Promise<{ success: boolean; data: CursorLoad[] }> => {
  const res = await fetch(`${BASE_URL}/cursors/loaded-materials`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch loaded materials");
  return await res.json();
};

export const fetchAllCursorLoads = async (params?: {
  cursor_id?: number | string;
  status?: string;
}): Promise<{ success: boolean; data: CursorLoad[] }> => {
  const query = new URLSearchParams();
  if (params?.cursor_id) query.append("cursor_id", String(params.cursor_id));
  if (params?.status) query.append("status", params.status);

  const res = await fetch(`${BASE_URL}/cursors/loads?${query.toString()}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch loads");
  return await res.json();
};

/* =========================================================================
   BRANCH (OFFICE) DELIVERIES
   ========================================================================= */

export const createBranchDelivery = async (data: {
  office_id: number;
  cursor_load_id?: number | null;
  product_name: string;
  category?: string;
  product_id?: number | null;
  quantity: number;
  price: number;
  vehicle_id?: number | null;
  vehicle_number?: string;
  driver_name?: string;
  date?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; data: BranchDeliveryLog }> => {
  const res = await fetch(`${BASE_URL}/cursors/branch-delivery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to record branch delivery");
  return json;
};

export const fetchBranchDeliveries = async (
  officeId: number | string = "all"
): Promise<{ success: boolean; data: BranchDeliveryLog[] }> => {
  const res = await fetch(`${BASE_URL}/cursors/branch-deliveries/${officeId}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to fetch branch deliveries");
  return await res.json();
};

export const addBranchDeliveryToStock = async (
  id: number | string
): Promise<{ success: boolean; message: string; data: BranchDeliveryLog }> => {
  const res = await fetch(`${BASE_URL}/cursors/branch-deliveries/${id}/add-to-stock`, {
    method: "POST",
    headers: { ...getAuthHeader() },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to add delivery to stock");
  return json;
};
