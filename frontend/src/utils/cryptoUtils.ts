import CryptoJS from "crypto-js";

// Enterprise secure secret mirroring Tripzo architecture
const SECRET_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CRYPTO_SECRET) ||
  "sureshaswath05!";

const key = CryptoJS.SHA256(SECRET_KEY);
const iv = CryptoJS.enc.Hex.parse("00000000000000000000000000000000"); // 16-byte zero IV

/**
 * Encrypts an object or string into an AES-256-CBC hex string
 */
export function encryptPayload(data: any): string {
  if (data === undefined || data === null) return "";
  try {
    const text = typeof data === "object" ? JSON.stringify(data) : String(data);
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  } catch (err) {
    console.error("[CryptoUtils] Encrypt error:", err);
    return "";
  }
}

/**
 * Decrypts an AES-256-CBC hex string back into its original object or string
 */
export function decryptPayload(cipherHex: string): any {
  if (!cipherHex) return null;
  try {
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Hex.parse(String(cipherHex).trim()),
    });

    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const rawStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!rawStr) return null;

    try {
      return JSON.parse(rawStr);
    } catch {
      return rawStr;
    }
  } catch (err) {
    console.error("[CryptoUtils] Decrypt error:", err);
    return null;
  }
}

/**
 * Generates HMAC-SHA256 client signature to protect against token hijacking & replay attacks
 */
export function generateClientSignature(token: string, timestamp: number | string): string {
  return CryptoJS.HmacSHA256(`${token || ""}:${timestamp || ""}`, SECRET_KEY).toString(
    CryptoJS.enc.Hex
  );
}

/**
 * Generates security headers for backend API requests
 */
export function getSecurityHeaders(token?: string): Record<string, string> {
  const timestamp = Date.now().toString();
  const headers: Record<string, string> = {
    "x-client-timestamp": timestamp,
    "x-encrypted-transfer": "true",
  };

  if (token) {
    headers["x-client-signature"] = generateClientSignature(token, timestamp);
  }

  return headers;
}
