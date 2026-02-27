import { BASE_URL, getAuthHeader } from "./base";

export const fetchUnreadCount = async () => {
    const res = await fetch(`${BASE_URL}/notification/unread-count`, {
        headers: getAuthHeader(),
    });
    return await res.json();
};

export const fetchNotifications = async () => {
    const res = await fetch(`${BASE_URL}/notification`, {
        headers: getAuthHeader(),
    });
    return await res.json();
};

export const markAsRead = async (id: number) => {
    const res = await fetch(`${BASE_URL}/notification/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeader(),
    });
    return await res.json();
};
