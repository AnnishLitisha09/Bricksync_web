export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Not Defined";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    } catch (error) {
        return "Invalid Date";
    }
};
