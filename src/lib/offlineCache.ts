import api from "./api";
import localforage from "localforage";
import { toast } from "sonner";

let lastOfflineToastTime = 0;

/**
 * Fetches data from the API and caches it in IndexedDB.
 * If the network request fails, it attempts to return the cached data (valid for 1 day).
 * @param url The API endpoint to fetch
 * @param cacheKey The key used to store the data in IndexedDB
 * @returns The data from the API or the cached data
 */
export const fetchWithCache = async (url: string, cacheKey: string) => {
  try {
    const res = await api.get(url);
    await localforage.setItem(cacheKey, {
      data: res.data,
      timestamp: Date.now(),
    });
    return res.data;
  } catch (err) {
    console.warn(
      `Network request to ${url} failed. Attempting to load from cache: ${cacheKey}`,
    );

    const cachedItem: any = await localforage.getItem(cacheKey);

    if (cachedItem && cachedItem.data && cachedItem.timestamp) {
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const age = Date.now() - cachedItem.timestamp;

      if (age < ONE_DAY_MS) {
        if (Date.now() - lastOfflineToastTime > 10000) {
          toast.warning(
            "You are offline. Operating on cached data from the last 24 hours.",
            {
              description:
                "Some actions might not be saved until connection is restored.",
            },
          );
          lastOfflineToastTime = Date.now();
        }
        return cachedItem.data;
      } else {
        toast.error(
          "Offline cached data is older than 1 day and has expired. Please reconnect.",
        );
        throw new Error("Cache expired");
      }
    } else if (cachedItem && !cachedItem.timestamp) {
      if (Date.now() - lastOfflineToastTime > 10000) {
        toast.warning("You are offline. Operating on cached data.");
        lastOfflineToastTime = Date.now();
      }
      return cachedItem;
    }

    throw err;
  }
};

/**
 * Utility to clear specific or all cached items from IndexedDB storage.
 */
export const clearOfflineCache = async (cacheKey?: string) => {
  if (cacheKey) {
    await localforage.removeItem(cacheKey);
  } else {
    await localforage.clear();
  }
};

