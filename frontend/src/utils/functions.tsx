export const encryptId = (id: number) => {
    return btoa(`${id}_secure`);
};

export const decryptId = (hash: string) => {
    try {
        const decoded = atob(hash);
        const match = decoded.match(/(\d+)_secure/);
        return match ? Number(match[1]) : null;
    } catch {
        return null;
    }
};
