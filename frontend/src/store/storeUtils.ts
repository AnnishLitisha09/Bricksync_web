/**
 * Returns true if the data is considered stale and should be re-fetched.
 * @param lastFetched - timestamp of last fetch (Date.now()), or null if never fetched
 * @param ttlMs       - time-to-live in milliseconds (default: 2 minutes)
 */
export const isStale = (lastFetched: number | null, ttlMs = 120_000): boolean => {
    if (lastFetched === null) return true;
    return Date.now() - lastFetched > ttlMs;
};
