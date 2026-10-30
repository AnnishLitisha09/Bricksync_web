"use strict";

const crypto = require("crypto");

// Secure Key for BrickSync (Mirrors Tripzo encryption methodology)
const CRYPTO_SECRET =
  process.env.CRYPTO_SECRET ||
  process.env.QR_SECRET ||
  "sureshaswath05!";

const key = crypto.createHash("sha256").update(CRYPTO_SECRET).digest();
const iv = Buffer.alloc(16, 0); // 16-byte zero IV for cross-platform compatibility (Node, Web Crypto, Flutter)

/**
 * Encrypts an object or string into an AES-256-CBC hex string
 */
function encryptPayload(data) {
  if (data === undefined || data === null) return "";
  try {
    const text = typeof data === "object" ? JSON.stringify(data) : String(data);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  } catch (err) {
    console.error("[Encryption] Encrypt payload error:", err.message);
    return "";
  }
}

/**
 * Decrypts an AES-256-CBC hex string back into its original object or string
 */
function decryptPayload(cipherHex) {
  if (!cipherHex) return null;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(String(cipherHex).trim(), "hex", "utf8");
    decrypted += decipher.final("utf8");

    try {
      return JSON.parse(decrypted);
    } catch (_) {
      return decrypted;
    }
  } catch (err) {
    console.error("[Encryption] Decrypt payload error:", err.message);
    return null;
  }
}

/**
 * Generates/Verifies HMAC or SHA-256 Client Signature
 * Prevents raw cURL replay attacks if token is leaked without client app context
 */
function generateSignature(token, timestamp) {
  return crypto
    .createHmac("sha256", CRYPTO_SECRET)
    .update(`${token || ""}:${timestamp || ""}`)
    .digest("hex");
}

function verifyClientSignature(token, timestamp, signature) {
  if (!signature || !timestamp) return false;

  // Verify timestamp is within 10 minutes to prevent replay attacks
  const now = Date.now();
  const time = parseInt(timestamp, 10);
  if (isNaN(time) || Math.abs(now - time) > 10 * 60 * 1000) {
    return false;
  }

  const expected = generateSignature(token, timestamp);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

module.exports = {
  CRYPTO_SECRET,
  encryptPayload,
  decryptPayload,
  generateSignature,
  verifyClientSignature,
};
