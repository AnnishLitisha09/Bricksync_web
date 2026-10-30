import { getSecurityHeaders, decryptPayload } from "../utils/cryptoUtils";

const defaultBase = "http://localhost:5001";
export const BASE_URL = (import.meta.env?.VITE_API_URL as string) || `${defaultBase}/api`;
export const FILE_BASE_URL = (import.meta.env?.VITE_FILE_URL as string) || defaultBase;
export const BASE_URL_NO_API = (import.meta.env?.VITE_FILE_URL as string) || defaultBase;

/**
 * Returns security-hardened headers including JWT bearer and HMAC client signature
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  const security = getSecurityHeaders(token || undefined);

  return {
    Authorization: token ? `Bearer ${token}` : "",
    ...security,
  };
};

/**
 * Global fetch interceptor:
 * Transparently unwraps backend AES-256 encrypted payloads
 * so all UI components, custom hooks, and zustand stores receive decoded data seamlessly.
 */
declare global {
  interface Window {
    __bricksync_fetch_intercepted__?: boolean;
  }
}

if (typeof window !== "undefined" && !window.__bricksync_fetch_intercepted__) {
  window.__bricksync_fetch_intercepted__ = true;
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const response = await originalFetch(input, init);

    // Decorate response.json to automatically decrypt encoded response bodies
    const originalJson = response.json.bind(response);
    response.json = async function () {
      const data = await originalJson();
      if (data && data._encrypted === true && typeof data.payload === "string") {
        const decrypted = decryptPayload(data.payload);
        return decrypted !== null ? decrypted : data;
      }
      return data;
    };

    // Decorate clone() to preserve decryption behavior
    const originalClone = response.clone.bind(response);
    response.clone = function () {
      const cloned = originalClone();
      const originalClonedJson = cloned.json.bind(cloned);
      cloned.json = async function () {
        const data = await originalClonedJson();
        if (data && data._encrypted === true && typeof data.payload === "string") {
          const decrypted = decryptPayload(data.payload);
          return decrypted !== null ? decrypted : data;
        }
        return data;
      };
      return cloned;
    };

    return response;
  };
}
